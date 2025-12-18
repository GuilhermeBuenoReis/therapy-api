import { beforeEach, describe, expect, it } from 'vitest';
import { makeSubscription } from '../../../test/factories/make-subscription';
import { makeUser } from '../../../test/factories/make-user';
import { InMemoryPaymentRepository } from '../../../test/repositories/in-memory-payment-repository';
import { InMemorySubscriptionRepository } from '../../../test/repositories/in-memory-subscription-repository';
import { InMemoryUserRepository } from '../../../test/repositories/in-memory-user-repository';
import { MethodEnum, TypeEnum } from '../entities/payment';
import { SubscriptionStatus } from '../entities/subscription';
import { UniqueEntityID } from '../utils/unique-entity-id';
import { CancelSubscriptionService } from './cancel-subscription-service';
import { ConfirmUserPaymentService } from './confirm-user-payment-service';
import { CreatePaymentService } from './create-payment-service';
import { CreateSubscriptionService } from './create-subscription-service';
import { HandleStripeWebhookService } from './handle-stripe-webhook-service';
import { RenewSubscriptionService } from './renew-subscription-service';

let userRepository: InMemoryUserRepository;
let subscriptionRepository: InMemorySubscriptionRepository;
let paymentRepository: InMemoryPaymentRepository;
let confirmUserPaymentService: ConfirmUserPaymentService;
let createSubscriptionService: CreateSubscriptionService;
let renewSubscriptionService: RenewSubscriptionService;
let cancelSubscriptionService: CancelSubscriptionService;
let createPaymentService: CreatePaymentService;
let sut: HandleStripeWebhookService;

describe('Handle Stripe Webhook Service', () => {
  beforeEach(() => {
    userRepository = new InMemoryUserRepository();
    subscriptionRepository = new InMemorySubscriptionRepository();
    paymentRepository = new InMemoryPaymentRepository();

    confirmUserPaymentService = new ConfirmUserPaymentService(userRepository);
    createSubscriptionService = new CreateSubscriptionService(
      subscriptionRepository
    );
    renewSubscriptionService = new RenewSubscriptionService(
      subscriptionRepository
    );
    cancelSubscriptionService = new CancelSubscriptionService(
      subscriptionRepository
    );
    createPaymentService = new CreatePaymentService(paymentRepository);

    sut = new HandleStripeWebhookService(
      confirmUserPaymentService,
      createSubscriptionService,
      renewSubscriptionService,
      cancelSubscriptionService,
      createPaymentService
    );
  });

  it('should confirm the user payment when checkout session completes', async () => {
    const user = makeUser({}, new UniqueEntityID('user-01'));
    await userRepository.create(user);

    await sut.handle({
      event: {
        type: 'checkout.session.completed',
        mode: 'subscription',
        professionalId: 'professional-01',
        userId: 'user-01',
        sessionId: 'cs_test_123',
      },
    });

    expect(user.paymentConfirmedAt).toBeInstanceOf(Date);
  });

  it('should create a subscription and payment when invoice succeeds', async () => {
    const periodStart = new Date('2024-03-01T00:00:00Z');
    const periodEnd = new Date('2024-04-01T00:00:00Z');
    const paidAt = new Date('2024-03-01T12:00:00Z');

    await sut.handle({
      event: {
        type: 'invoice.payment_succeeded',
        professionalId: 'professional-01',
        userId: 'user-01',
        amountPaid: 2599,
        periodStart,
        periodEnd,
        paidAt,
        stripeInvoiceId: 'in_123',
      },
    });

    expect(subscriptionRepository.items).toHaveLength(1);
    const subscription = subscriptionRepository.items[0];
    expect(subscription.professionalId).toBe('professional-01');
    expect(subscription.startDate).toEqual(periodStart);
    expect(subscription.endDate).toEqual(periodEnd);

    expect(paymentRepository.items).toHaveLength(1);
    const payment = paymentRepository.items[0];
    expect(payment.amount).toBe(2599);
    expect(payment.type).toBe(TypeEnum.Subscription);
    expect(payment.method).toBe(MethodEnum.Credit);
    expect(payment.subscriptionId).toBe(subscription.id.toString());
    expect(payment.notes).toBe('Stripe invoice in_123');
    expect(payment.paidAt).toEqual(paidAt);
  });

  it('should renew subscription when one already exists', async () => {
    const existingSubscription = makeSubscription(
      {
        professionalId: 'professional-01',
        startDate: new Date('2024-01-01T00:00:00Z'),
        endDate: new Date('2024-02-01T00:00:00Z'),
        monthPrice: 1500,
      },
      new UniqueEntityID('sub_existing')
    );
    await subscriptionRepository.create(existingSubscription);

    const periodStart = new Date('2024-02-02T00:00:00Z');
    const periodEnd = new Date('2024-03-02T00:00:00Z');

    await sut.handle({
      event: {
        type: 'invoice.payment_succeeded',
        professionalId: 'professional-01',
        userId: 'user-01',
        amountPaid: 1899,
        periodStart,
        periodEnd,
      },
    });

    expect(subscriptionRepository.items).toHaveLength(1);
    expect(existingSubscription.startDate).toEqual(periodStart);
    expect(existingSubscription.endDate).toEqual(periodEnd);
    expect(existingSubscription.price).toBe(1899);

    expect(paymentRepository.items).toHaveLength(1);
    const payment = paymentRepository.items[0];
    expect(payment.subscriptionId).toBe(existingSubscription.id.toString());
    expect(payment.amount).toBe(1899);
  });

  it('should register payment even when renewal fails', async () => {
    const existingSubscription = makeSubscription(
      {
        professionalId: 'professional-01',
        startDate: new Date('2024-01-01T00:00:00Z'),
        endDate: new Date('2024-03-01T00:00:00Z'),
      },
      new UniqueEntityID('sub_existing')
    );
    await subscriptionRepository.create(existingSubscription);

    const periodStart = new Date('2024-02-15T00:00:00Z');
    const periodEnd = new Date('2024-03-15T00:00:00Z');

    await sut.handle({
      event: {
        type: 'invoice.payment_succeeded',
        professionalId: 'professional-01',
        userId: 'user-01',
        amountPaid: 1599,
        periodStart,
        periodEnd,
      },
    });

    expect(paymentRepository.items).toHaveLength(1);
    const payment = paymentRepository.items[0];
    expect(payment.subscriptionId).toBeNull();
    expect(payment.amount).toBe(1599);
  });

  it('should ignore failed invoices without creating payments', async () => {
    await sut.handle({
      event: {
        type: 'invoice.payment_failed',
        professionalId: 'professional-01',
        userId: 'user-01',
        stripeInvoiceId: 'in_999',
      },
    });

    expect(paymentRepository.items).toHaveLength(0);
  });

  it('should cancel subscription when Stripe notifies deletion', async () => {
    const subscription = makeSubscription(
      {
        professionalId: 'professional-01',
        status: SubscriptionStatus.Active,
      },
      new UniqueEntityID('sub_cancel')
    );
    await subscriptionRepository.create(subscription);

    await sut.handle({
      event: {
        type: 'customer.subscription.deleted',
        professionalId: 'professional-01',
        userId: 'user-01',
      },
    });

    expect(subscription.status).toBe(SubscriptionStatus.Canceled);
  });
});
