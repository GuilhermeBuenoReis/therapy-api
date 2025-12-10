import { beforeEach, describe, expect, it } from 'vitest';
import { makePatient } from '../../../../test/factories/make-patient';
import { InMemoryPatientRepository } from '../../../../test/repositories/in-memory-patient-repository';
import { ErrorPatientNotFound } from '../errors/patient-not-found';
import { ErrorPatientNotLinkedToProfessional } from '../errors/patient-not-linked-to-a-professional';
import { VerifyProfessionalHasAccessToPatient } from './verify-professional-has-access-to-patient';

let sut: VerifyProfessionalHasAccessToPatient;
let patientRepository: InMemoryPatientRepository;

describe('Verify Professional Has Access To Patient', () => {
  beforeEach(() => {
    patientRepository = new InMemoryPatientRepository();
    sut = new VerifyProfessionalHasAccessToPatient(patientRepository);
  });

  it('should validate access when patient belongs to professional', async () => {
    const patient = makePatient({ professionalsId: 'professional-01' });
    await patientRepository.create(patient);

    const result = await sut.execute({
      patientId: patient.id.toString(),
      professionalId: 'professional-01',
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value).toBeNull();
    }
  });

  it('should return error when patient does not exist', async () => {
    const result = await sut.execute({
      patientId: 'missing-patient',
      professionalId: 'professional-01',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ErrorPatientNotFound);
    }
  });

  it('should return error when patient is linked to another professional', async () => {
    const patient = makePatient({ professionalsId: 'professional-02' });
    await patientRepository.create(patient);

    const result = await sut.execute({
      patientId: patient.id.toString(),
      professionalId: 'professional-01',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ErrorPatientNotLinkedToProfessional);
    }
  });
});
