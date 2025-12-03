import { beforeEach, describe, expect, it } from 'vitest';
import { makePatient } from '../../../test/factories/make-patient';
import { InMemoryPatientRepository } from '../../../test/repositories/in-memory-patient-repository';
import { ErrorPatientNotFound } from './errors/patient-not-found';
import { ErrorPatientNotLinkedToProfessional } from './errors/patient-not-linked-to-a-professional';
import { GetPatientMedicalRecordService } from './get-patient-medical-record-service';
import { VerifyProfessionalHasAccessToPatient } from './rules/verify-professional-has-access-to-patient';

let sut: GetPatientMedicalRecordService;
let inMemoryPatientRepository: InMemoryPatientRepository;

describe('Get Patient Medical Record Service', () => {
  beforeEach(() => {
    inMemoryPatientRepository = new InMemoryPatientRepository();
    const verifier = new VerifyProfessionalHasAccessToPatient(
      inMemoryPatientRepository
    );
    sut = new GetPatientMedicalRecordService(
      inMemoryPatientRepository,
      verifier
    );
  });

  it('should return patient notes when access is allowed', async () => {
    const patient = makePatient({
      professionalsId: 'professional-01',
      note: 'Patient medical notes',
    });
    await inMemoryPatientRepository.create(patient);

    const result = await sut.handle({
      patientId: patient.id.toString(),
      professionalId: 'professional-01',
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.notes).toBe('Patient medical notes');
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

  it('should return error when professional does not own the patient', async () => {
    const patient = makePatient({ professionalsId: 'other-professional' });
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
});
