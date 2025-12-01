import { beforeEach, describe, expect, it } from 'vitest';
import { InMemoryPatientRepository } from '../../../test/repositories/in-memory-patient-repository';
import { Patient } from '../entities/patient';
import { UniqueEntityID } from '../utils/unique-entity-id';
import { DeletePatientService } from './delete-patient-service';
import { ErrorPatientNotFound } from './errors/patient-not-found';

let sut: DeletePatientService;
let inMemoryPatientRepository: InMemoryPatientRepository;

describe('Delete Patient Service', () => {
  beforeEach(() => {
    inMemoryPatientRepository = new InMemoryPatientRepository();

    sut = new DeletePatientService(inMemoryPatientRepository);
  });

  it('should be able to delete a patient', async () => {
    const patientId = new UniqueEntityID('patient-01');
    const patient = Patient.create(
      {
        userId: 'user-01',
        professionalsId: 'professional-01',
        name: 'Patient Name',
        birthDate: '1990-01-01',
        phone: '123456789',
        note: 'note',
      },
      patientId
    );

    await inMemoryPatientRepository.create(patient);

    const result = await sut.handle({
      patientId: patientId.toString(),
    });

    expect(result.isRight()).toBe(true);
    expect(inMemoryPatientRepository.items).toHaveLength(0);
  });

  it('should return left when patient does not exist', async () => {
    const result = await sut.handle({
      patientId: 'missing-id',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ErrorPatientNotFound);
    }
  });
});
