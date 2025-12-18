import { beforeEach, describe, expect, it } from 'vitest';
import { InMemoryPatientRepository } from '../../../test/repositories/in-memory-patient-repository';
import { InMemoryProfessionalsRepository } from '../../../test/repositories/in-memory-professionals-repository';
import { Patient } from '../entities/patient';
import { Professionals } from '../entities/professionals';
import { UniqueEntityID } from '../utils/unique-entity-id';
import { ProfessionalNotFoundError } from './errors/professional-not-found-error';
import { ListPatientsByProfessionalService } from './list-patients-by-professional-service';

let sut: ListPatientsByProfessionalService;
let inMemoryPatientRepository: InMemoryPatientRepository;
let inMemoryProfessionalsRepository: InMemoryProfessionalsRepository;

describe('List Patients By Professional Service', () => {
  beforeEach(() => {
    inMemoryPatientRepository = new InMemoryPatientRepository();
    inMemoryProfessionalsRepository = new InMemoryProfessionalsRepository();

    sut = new ListPatientsByProfessionalService(
      inMemoryProfessionalsRepository,
      inMemoryPatientRepository
    );
  });

  it('should return patients for an existing professional', async () => {
    const professional = Professionals.create(
      {
        userId: new UniqueEntityID('user-01'),
        specialty: 'specialty',
        registration_number: '123456789',
        phone: '123456789',
        biography: 'bio',
        pricePerSession: 50,
        monthlyPrice: 100,
        sessionDuration: 60,
      },
      new UniqueEntityID('professional-01')
    );

    await inMemoryProfessionalsRepository.create(professional);

    const patient = Patient.create(
      {
        userId: 'user-01',
        professionalsId: professional.id.toString(),
        name: 'Jane Doe',
        birthDate: '1990-01-01',
        phone: '987654321',
        note: 'note',
      },
      new UniqueEntityID('patient-01')
    );

    const patient2 = Patient.create(
      {
        userId: 'user-02',
        professionalsId: professional.id.toString(),
        name: 'Jane Doe',
        birthDate: '1990-01-01',
        phone: '987654321',
        note: 'note',
      },
      new UniqueEntityID('patient-02')
    );

    await inMemoryPatientRepository.create(patient);
    await inMemoryPatientRepository.create(patient2);

    const result = await sut.handle({
      professionalId: professional.id.toString(),
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.patient).toHaveLength(2);
      expect(result.value.patient[0]).toEqual(patient);
      expect(result.value.patient[1]).toEqual(patient2);
    }
  });

  it('should return error when professional does not exist', async () => {
    const result = await sut.handle({
      professionalId: 'non-existent-professional',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ProfessionalNotFoundError);
    }
  });
});
