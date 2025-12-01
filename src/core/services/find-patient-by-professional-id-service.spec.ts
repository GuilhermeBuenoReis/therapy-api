import { beforeEach, describe, expect, it } from 'vitest';
import { InMemoryPatientRepository } from '../../../test/repositories/in-memory-patient-repository';
import { Patient } from '../entities/patient';
import { UniqueEntityID } from '../utils/unique-entity-id';
import { ErrorPatientNotFound } from './errors/patient-not-found';
import { FindPatientByProfessionalIdService } from './find-patient-by-professional-id-service';

let sut: FindPatientByProfessionalIdService;
let inMemoryPatientRepository: InMemoryPatientRepository;

describe('Find Patient By Professional Id Service', () => {
  beforeEach(() => {
    inMemoryPatientRepository = new InMemoryPatientRepository();

    sut = new FindPatientByProfessionalIdService(inMemoryPatientRepository);
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
      professionalId: 'missing-professional',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ErrorPatientNotFound);
    }
  });
});
