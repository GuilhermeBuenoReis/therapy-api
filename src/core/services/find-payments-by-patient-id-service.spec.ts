import { beforeEach, describe, expect, it } from 'vitest';
import { InMemoryPaymentRepository } from '../../../test/repositories/in-memory-payment-repository';
import { InMemoryPatientRepository } from '../../../test/repositories/in-memory-patient-repository';
import { makePatient } from '../../../test/factories/make-patient';
import { makePayment } from '../../../test/factories/make-payment';
import { UniqueEntityID } from '../utils/unique-entity-id';
import { ErrorPaymentsForPatientNotFound } from './errors/error-payments-for-patient-not-found';
import { ErrorPatientNotFound } from './errors/patient-not-found';
import { ErrorPatientNotLinkedToProfessional } from './errors/patient-not-linked-to-a-professional';
import { FindPaymentsByPatientIdService } from './find-payments-by-patient-id-service';
import { VerifyProfessionalHasAccessToPatient } from './rules/verify-professional-has-access-to-patient';

let sut: FindPaymentsByPatientIdService;
let inMemoryPaymentRepository: InMemoryPaymentRepository;
let inMemoryPatientRepository: InMemoryPatientRepository;

describe('Find Payments By Patient Id Service', () => {
  beforeEach(() => {
    inMemoryPaymentRepository = new InMemoryPaymentRepository();
    inMemoryPatientRepository = new InMemoryPatientRepository();
    const verifier = new VerifyProfessionalHasAccessToPatient(
      inMemoryPatientRepository
    );
    sut = new FindPaymentsByPatientIdService(
      inMemoryPaymentRepository,
      verifier
    );
  });

  it('should be able to find payments by patient id', async () => {
    const patient = makePatient({ professionalsId: 'professional-01' });
    await inMemoryPatientRepository.create(patient);

    const payment = makePayment(
      {
        professionalId: 'professional-01',
        patientId: patient.id.toString(),
        sessionId: 'session-01',
        amount: 150,
      },
      new UniqueEntityID('payment-01')
    );

    await inMemoryPaymentRepository.create(payment);

    const result = await sut.handle({
      patientId: patient.id.toString(),
      professionalId: 'professional-01',
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.payments).toHaveLength(1);
      expect(result.value.payments[0].patientId).toBe(patient.id.toString());
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

  it('should return left when no payments for patient', async () => {
    const patient = makePatient({ professionalsId: 'professional-01' });
    await inMemoryPatientRepository.create(patient);

    const result = await sut.handle({
      patientId: patient.id.toString(),
      professionalId: 'professional-01',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ErrorPaymentsForPatientNotFound);
    }
  });
});
