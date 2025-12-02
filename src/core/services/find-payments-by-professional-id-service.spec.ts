import { beforeEach, describe, expect, it } from 'vitest';
import { InMemoryPaymentRepository } from '../../../test/repositories/in-memory-payment-repository';
import { makePayment } from '../../../test/factories/make-payment';
import { UniqueEntityID } from '../utils/unique-entity-id';
import { ErrorPaymentsForProfessionalNotFound } from './errors/error-payments-for-professional-not-found';
import { FindPaymentsByProfessionalIdService } from './find-payments-by-professional-id-service';

let sut: FindPaymentsByProfessionalIdService;
let inMemoryPaymentRepository: InMemoryPaymentRepository;

describe('Find Payments By Professional Id Service', () => {
  beforeEach(() => {
    inMemoryPaymentRepository = new InMemoryPaymentRepository();
    sut = new FindPaymentsByProfessionalIdService(inMemoryPaymentRepository);
  });

  it('should be able to find payments by professional id', async () => {
    const payment = makePayment({
      professionalId: 'professional-01',
      patientId: 'patient-01',
      sessionId: 'session-01',
      amount: 150,
    }, new UniqueEntityID('payment-01'));

    await inMemoryPaymentRepository.create(payment);

    const result = await sut.handle({
      professionalId: 'professional-01',
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.payments).toHaveLength(1);
      expect(result.value.payments[0].professionalId).toBe('professional-01');
    }
  });

  it('should return left when no payments for professional', async () => {
    const result = await sut.handle({
      professionalId: 'missing-professional',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ErrorPaymentsForProfessionalNotFound);
    }
  });
});
