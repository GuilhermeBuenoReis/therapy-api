import { beforeEach, describe, expect, it } from 'vitest';
import { InMemoryPatientRepository } from '../../../test/repositories/in-memory-patient-repository';
import { Patient } from '../entities/patient';
import { UniqueEntityID } from '../utils/unique-entity-id';
import { EditPatientService } from './edit-patient-service';
import { ErrorPatientNotFound } from './errors/patient-not-found';

let sut: EditPatientService;
let inMemoryPatientRepository: InMemoryPatientRepository;

describe('Edit Patient Service', () => {
  beforeEach(() => {
    inMemoryPatientRepository = new InMemoryPatientRepository();

    sut = new EditPatientService(inMemoryPatientRepository);
  });

  it('should be able to edit a patient', async () => {
    const patientId = new UniqueEntityID('patient-01');
    const patient = Patient.create(
      {
        userId: 'user-01',
        professionalsId: 'professional-01',
        name: 'Old Name',
        birthDate: '1990-01-01',
        phone: '123456789',
        note: 'old note',
      },
      patientId
    );

    await inMemoryPatientRepository.create(patient);

    const result = await sut.handle({
      patientId: patientId.toString(),
      name: 'New Name',
      birthDate: '1991-02-02',
      phone: '987654321',
      note: 'new note',
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      const updated = result.value.patient;
      expect(updated.name).toBe('New Name');
      expect(updated.birthDate).toBe('1991-02-02');
      expect(updated.phone).toBe('987654321');
      expect(updated.note).toBe('new note');
      expect(updated.updatedAt).toBeInstanceOf(Date);
      expect(updated.id.toString()).toBe('patient-01');
    }
  });

  it('should return left when patient does not exist', async () => {
    const result = await sut.handle({
      patientId: 'missing-id',
      name: 'Name',
      birthDate: '1991-02-02',
      phone: '987654321',
      note: 'note',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ErrorPatientNotFound);
    }
  });
});
