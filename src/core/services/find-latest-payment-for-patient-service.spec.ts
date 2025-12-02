import { beforeEach, describe, expect, it } from 'vitest';
import { InMemoryPaymentRepository } from '../../../test/repositories/in-memory-payment-repository';
import { makePayment } from '../../../test/factories/make-payment';
import { ErrorLatestPaymentForPatientNotFound } from './errors/error-latest-payment-for-patient-not-found';
import { FindLatestPaymentForPatientService } from './find-latest-payment-for-patient-service';

let sut: FindLatestPaymentForPatientService;
let inMemoryPaymentRepository: InMemoryPaymentRepository;

describe('Find Latest Payment For Patient Service', () => {
  beforeEach(() => {
    inMemoryPaymentRepository = new InMemoryPaymentRepository();
    sut = new FindLatestPaymentForPatientService(inMemoryPaymentRepository);
  });

  it('should be able to find the latest payment for a patient', async () => {
    const oldPayment = makePayment({
      professionalId: 'professional-01',
      patientId: 'patient-01',
      sessionId: 'session-01',
      amount: 100,
      paidAt: new Date('2024-05-10T09:15:30Z'),
    });

    const latestPayment = makePayment({
      professionalId: 'professional-01',
      patientId: 'patient-01',
      sessionId: 'session-02',
      amount: 200,
      paidAt: new Date('2024-09-21T16:48:05Z'),
    });

    await inMemoryPaymentRepository.create(oldPayment);
    await inMemoryPaymentRepository.create(latestPayment);

    const result = await sut.handle({
      patientId: 'patient-01',
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.payment.sessionId).toBe('session-02');
      expect(result.value.payment.amount).toBe(200);
    }
  });

  it('should return left when no payments for patient', async () => {
    const result = await sut.handle({
      patientId: 'missing-patient',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ErrorLatestPaymentForPatientNotFound);
    }
  });
});
