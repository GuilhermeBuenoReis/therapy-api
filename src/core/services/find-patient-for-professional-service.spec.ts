import { beforeEach, describe, expect, it } from 'vitest';
import { InMemoryPatientRepository } from '../../../test/repositories/in-memory-patient-repository';
import { Patient } from '../entities/patient';
import { UniqueEntityID } from '../utils/unique-entity-id';
import { ErrorPatientNotFound } from './errors/patient-not-found';
import { ErrorPatientNotLinkedToProfessional } from './errors/patient-not-linked-to-a-professional';
import { FindPatientForProfessionalService } from './find-patient-for-professional-service';
import { VerifyProfessionalHasAccessToPatient } from './rules/verify-professional-has-access-to-patient';

let sut: FindPatientForProfessionalService;
let inMemoryPatientRepository: InMemoryPatientRepository;

describe('Find Patient By Professional Id Service', () => {
  beforeEach(() => {
    inMemoryPatientRepository = new InMemoryPatientRepository();

    const verifier = new VerifyProfessionalHasAccessToPatient(
      inMemoryPatientRepository
    );

    sut = new FindPatientForProfessionalService(
      inMemoryPatientRepository,
      verifier
    );
  });

  it('should be able to find a patient by professional id', async () => {
    const patient = Patient.create(
      {
        userId: 'user-01',
        professionalsId: 'professional-01',
        name: 'Patient Name',
        birthDate: '1990-01-01',
        phone: '123456789',
        note: 'note',
      },
      new UniqueEntityID('patient-01')
    );

    await inMemoryPatientRepository.create(patient);

    const result = await sut.handle({
      patientId: patient.id.toString(),
      professionalId: 'professional-01',
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.patient.id.toString()).toEqual('patient-01');
      expect(result.value.patient.professionalsId).toEqual('professional-01');
    }
  });

  it('should return left when patient not found for professional id', async () => {
    const result = await sut.handle({
      patientId: 'missing-patient',
      professionalId: 'missing-professional',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ErrorPatientNotFound);
    }
  });

  it('should return error when patient not linked to professional', async () => {
    const patient = Patient.create(
      {
        userId: 'user-01',
        professionalsId: 'another-professional',
        name: 'Patient Name',
        birthDate: '1990-01-01',
        phone: '123456789',
        note: 'note',
      },
      new UniqueEntityID('patient-01')
    );

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
