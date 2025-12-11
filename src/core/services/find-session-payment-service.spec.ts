import { beforeEach, describe, expect, it } from 'vitest';
import { InMemoryPaymentRepository } from '../../../test/repositories/in-memory-payment-repository';
import { makePayment } from '../../../test/factories/make-payment';
import { ErrorPaymentNotFound } from './errors/error-payment-not-found';
import { FindSubscriptionPaymentService } from './find-session-payment-service';

let sut: FindSubscriptionPaymentService;
let inMemoryPaymentRepository: InMemoryPaymentRepository;

describe('Find Subscription Payment Service', () => {
  beforeEach(() => {
    inMemoryPaymentRepository = new InMemoryPaymentRepository();
    sut = new FindSubscriptionPaymentService(inMemoryPaymentRepository);
  });

  it('should be able to find a payment by subscription id', async () => {
    const payment = makePayment({
      professionalId: 'professional-01',
      subscriptionId: 'subscription-01',
      amount: 120,
      paidAt: new Date('2024-07-05T13:40:00Z'),
    });

    await inMemoryPaymentRepository.create(payment);

    const result = await sut.handle({
      professionalId: 'professional-01',
      subscriptionId: 'subscription-01',
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.payment.subscriptionId).toBe('subscription-01');
    }
  });

  it('should return left when no payment for subscription', async () => {
    const result = await sut.handle({
      professionalId: 'professional-01',
      subscriptionId: 'missing-subscription',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ErrorPaymentNotFound);
    }
  });
});
