import { beforeEach, describe, expect, it } from 'vitest';
import { InMemoryPaymentRepository } from '../../../test/repositories/in-memory-payment-repository';
import { makePayment } from '../../../test/factories/make-payment';
import { ErrorLatestPaymentForProfessionalNotFound } from './errors/error-latest-payment-for-patient-not-found';
import { FindLatestPaymentForProfessionalService } from './find-latest-payment-for-patient-service';

let sut: FindLatestPaymentForProfessionalService;
let inMemoryPaymentRepository: InMemoryPaymentRepository;

describe('Find Latest Payment For Professional Service', () => {
  beforeEach(() => {
    inMemoryPaymentRepository = new InMemoryPaymentRepository();
    sut = new FindLatestPaymentForProfessionalService(
      inMemoryPaymentRepository
    );
  });

  it('should be able to find the latest payment for a professional', async () => {
    const oldPayment = makePayment({
      professionalId: 'professional-01',
      amount: 100,
      paidAt: new Date('2024-05-10T09:15:30Z'),
    });

    const latestPayment = makePayment({
      professionalId: 'professional-01',
      amount: 200,
      paidAt: new Date('2024-09-21T16:48:05Z'),
    });

    await inMemoryPaymentRepository.create(oldPayment);
    await inMemoryPaymentRepository.create(latestPayment);

    const result = await sut.handle({
      professionalId: 'professional-01',
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.payment.id.toString()).toBe(
        latestPayment.id.toString()
      );
      expect(result.value.payment.amount).toBe(200);
    }
  });

  it('should return left when no payments for professional', async () => {
    const result = await sut.handle({
      professionalId: 'professional-01',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(
        ErrorLatestPaymentForProfessionalNotFound
      );
    }
  });
});
