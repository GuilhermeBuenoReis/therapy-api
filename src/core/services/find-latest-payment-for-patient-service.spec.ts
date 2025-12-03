import { beforeEach, describe, expect, it } from 'vitest';
import { InMemoryPaymentRepository } from '../../../test/repositories/in-memory-payment-repository';
import { InMemoryPatientRepository } from '../../../test/repositories/in-memory-patient-repository';
import { makePatient } from '../../../test/factories/make-patient';
import { makePayment } from '../../../test/factories/make-payment';
import { ErrorLatestPaymentForPatientNotFound } from './errors/error-latest-payment-for-patient-not-found';
import { ErrorPatientNotFound } from './errors/patient-not-found';
import { ErrorPatientNotLinkedToProfessional } from './errors/patient-not-linked-to-a-professional';
import { FindLatestPaymentForPatientService } from './find-latest-payment-for-patient-service';
import { VerifyProfessionalHasAccessToPatient } from './rules/verify-professional-has-access-to-patient';

let sut: FindLatestPaymentForPatientService;
let inMemoryPaymentRepository: InMemoryPaymentRepository;
let inMemoryPatientRepository: InMemoryPatientRepository;

describe('Find Latest Payment For Patient Service', () => {
  beforeEach(() => {
    inMemoryPaymentRepository = new InMemoryPaymentRepository();
    inMemoryPatientRepository = new InMemoryPatientRepository();
    const verifier = new VerifyProfessionalHasAccessToPatient(
      inMemoryPatientRepository
    );
    sut = new FindLatestPaymentForPatientService(
      inMemoryPaymentRepository,
      verifier
    );
  });

  it('should be able to find the latest payment for a patient', async () => {
    const patient = makePatient({ professionalsId: 'professional-01' });
    await inMemoryPatientRepository.create(patient);

    const oldPayment = makePayment({
      professionalId: 'professional-01',
      patientId: patient.id.toString(),
      sessionId: 'session-01',
      amount: 100,
      paidAt: new Date('2024-05-10T09:15:30Z'),
    });

    const latestPayment = makePayment({
      professionalId: 'professional-01',
      patientId: patient.id.toString(),
      sessionId: 'session-02',
      amount: 200,
      paidAt: new Date('2024-09-21T16:48:05Z'),
    });

    await inMemoryPaymentRepository.create(oldPayment);
    await inMemoryPaymentRepository.create(latestPayment);

    const result = await sut.handle({
      patientId: patient.id.toString(),
      professionalId: 'professional-01',
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.payment.sessionId).toBe('session-02');
      expect(result.value.payment.amount).toBe(200);
    }
  });

  it('should return error when patient does not exist', async () => {
    const result = await sut.handle({
      patientId: 'missing-patient',
      professionalId: 'professional-01',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ErrorPatientNotFound);
    }
  });

  it('should return error when patient is linked to another professional', async () => {
    const patient = makePatient({ professionalsId: 'another-professional' });
    await inMemoryPatientRepository.create(patient);

    const result = await sut.handle({
      patientId: patient.id.toString(),
      professionalId: 'professional-01',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(
        ErrorPatientNotLinkedToProfessional
      );
    }
  });

  it('should return left when no payments for patient but access is valid', async () => {
    const patient = makePatient({ professionalsId: 'professional-01' });
    await inMemoryPatientRepository.create(patient);

    const result = await sut.handle({
      patientId: patient.id.toString(),
      professionalId: 'professional-01',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(
        ErrorLatestPaymentForPatientNotFound
      );
    }
  });
});
