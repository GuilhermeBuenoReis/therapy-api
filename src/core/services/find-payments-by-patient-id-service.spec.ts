import { beforeEach, describe, expect, it } from 'vitest';
import { InMemoryPaymentRepository } from '../../../test/repositories/in-memory-payment-repository';
import { makePayment } from '../../../test/factories/make-payment';
import { UniqueEntityID } from '../utils/unique-entity-id';
import { ErrorPaymentsForPatientNotFound } from './errors/error-payments-for-patient-not-found';
import { FindPaymentsByPatientIdService } from './find-payments-by-patient-id-service';

let sut: FindPaymentsByPatientIdService;
let inMemoryPaymentRepository: InMemoryPaymentRepository;

describe('Find Payments By Patient Id Service', () => {
  beforeEach(() => {
    inMemoryPaymentRepository = new InMemoryPaymentRepository();
    sut = new FindPaymentsByPatientIdService(inMemoryPaymentRepository);
  });

  it('should be able to find payments by patient id', async () => {
    const payment = makePayment(
      {
        professionalId: 'professional-01',
        patientId: 'patient-01',
        sessionId: 'session-01',
        amount: 150,
      },
      new UniqueEntityID('payment-01')
    );

    await inMemoryPaymentRepository.create(payment);

    const result = await sut.handle({
      patientId: 'patient-01',
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.payments).toHaveLength(1);
      expect(result.value.payments[0].patientId).toBe('patient-01');
    }
  });

  it('should return left when no payments for patient', async () => {
    const result = await sut.handle({
      patientId: 'missing-patient',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ErrorPaymentsForPatientNotFound);
    }
  });
});
