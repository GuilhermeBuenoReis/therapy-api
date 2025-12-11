import { beforeEach, describe, expect, it } from 'vitest';
import { makeSubscription } from '../../../test/factories/make-subscription';
import { InMemorySubscriptionPaymentLogRepository } from '../../../test/repositories/in-memory-subscription-payment-log-repository';
import { InMemorySubscriptionRepository } from '../../../test/repositories/in-memory-subscription-repository';
import { RegisterSubscriptionPaymentService } from './register-subscription-payment-service';
import { ErrorSubscriptionNotFound } from './errors/error-subscription-not-found';

let sut: RegisterSubscriptionPaymentService;
let subscriptionRepository: InMemorySubscriptionRepository;
let paymentLogRepository: InMemorySubscriptionPaymentLogRepository;

describe('Register Subscription Payment Service', () => {
  beforeEach(() => {
    subscriptionRepository = new InMemorySubscriptionRepository();
    paymentLogRepository = new InMemorySubscriptionPaymentLogRepository();
    sut = new RegisterSubscriptionPaymentService(
      subscriptionRepository,
      paymentLogRepository
    );
  });

  it('should register a payment log for the active subscription', async () => {
    const subscription = makeSubscription({
      professionalId: 'professional-01',
    });
    await subscriptionRepository.create(subscription);

    const paidAt = new Date('2024-02-05T10:00:00');

    const result = await sut.handle({
      professionalId: 'professional-01',
      amount: 450,
      paidAt,
      notes: 'Manual renewal via PIX',
    });

    expect(result.isRight()).toBe(true);
    expect(paymentLogRepository.items).toHaveLength(1);

    const [stored] = paymentLogRepository.items;
    expect(stored.subscriptionId).toEqual(subscription.id.toString());
    expect(stored.professionalId).toEqual('professional-01');
    expect(stored.amount).toBe(450);
    expect(stored.paidAt).toEqual(paidAt);
  });

  it('should store notes as null when not provided', async () => {
    const subscription = makeSubscription({
      professionalId: 'professional-01',
    });
    await subscriptionRepository.create(subscription);

    const result = await sut.handle({
      professionalId: 'professional-01',
      amount: 400,
      paidAt: new Date('2024-02-10T00:00:00'),
    });

    expect(result.isRight()).toBe(true);
    const [stored] = paymentLogRepository.items;
    expect(stored.notes).toBeNull();
  });

  it('should not register payment log when subscription is missing', async () => {
    const result = await sut.handle({
      professionalId: 'missing',
      amount: 400,
      paidAt: new Date(),
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ErrorSubscriptionNotFound);
    }
  });
});
