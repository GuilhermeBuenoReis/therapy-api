import { beforeEach, describe, expect, it } from 'vitest';
import { InMemoryPaymentRepository } from '../../../test/repositories/in-memory-payment-repository';
import { makePayment } from '../../../test/factories/make-payment';
import { UniqueEntityID } from '../utils/unique-entity-id';
import { ErrorSubscriptionPaymentsNotFound } from './errors/error-payments-for-patient-not-found';
import { FindSubscriptionPaymentsByProfessionalService } from './find-payments-by-patient-id-service';

let sut: FindSubscriptionPaymentsByProfessionalService;
let inMemoryPaymentRepository: InMemoryPaymentRepository;

describe('Find Subscription Payments By Professional Service', () => {
  beforeEach(() => {
    inMemoryPaymentRepository = new InMemoryPaymentRepository();
    sut = new FindSubscriptionPaymentsByProfessionalService(
      inMemoryPaymentRepository
    );
  });

  it('should be able to find payments by professional id', async () => {
    const payment = makePayment(
      {
        professionalId: 'professional-01',
        subscriptionId: 'subscription-01',
        amount: 150,
      },
      new UniqueEntityID('payment-01')
    );

    await inMemoryPaymentRepository.create(payment);

    const result = await sut.handle({
      professionalId: 'professional-01',
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.payments).toHaveLength(1);
      expect(result.value.payments[0].subscriptionId).toBe('subscription-01');
    }
  });

  it('should filter by subscription when provided', async () => {
    await inMemoryPaymentRepository.create(
      makePayment({
        professionalId: 'professional-01',
        subscriptionId: 'subscription-01',
      })
    );
    await inMemoryPaymentRepository.create(
      makePayment({
        professionalId: 'professional-01',
        subscriptionId: 'subscription-02',
      })
    );

    const result = await sut.handle({
      professionalId: 'professional-01',
      subscriptionId: 'subscription-02',
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.payments).toHaveLength(1);
      expect(result.value.payments[0].subscriptionId).toBe('subscription-02');
    }
  });

  it('should return left when no payments for professional/subscription', async () => {
    const result = await sut.handle({
      professionalId: 'missing-professional',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(
        ErrorSubscriptionPaymentsNotFound
      );
    }
  });
});
