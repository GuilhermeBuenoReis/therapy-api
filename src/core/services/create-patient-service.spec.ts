import { beforeEach, describe, expect, it } from 'vitest';
import { InMemoryPatientRepository } from '../../../test/repositories/in-memory-patient-repository';
import { InMemoryProfessionalsRepository } from '../../../test/repositories/in-memory-professionals-repository';
import { InMemoryUserRepository } from '../../../test/repositories/in-memory-user-repository';
import { FakeCheckSubscriptionStatusMiddleware } from '../../../test/factories/fake-check-subscription-status-middleware';
import { Professionals } from '../entities/professionals';
import { User } from '../entities/user';
import { UniqueEntityID } from '../utils/unique-entity-id';
import { CreatePatientService } from './create-patient-service';
import { ErrorPatientNotLinkedToProfessional } from './errors/patient-not-linked-to-a-professional';
import { ErrorUserNotFound } from './errors/user-not-found';

let sut: CreatePatientService;
let inMemoryPatientRepository: InMemoryPatientRepository;
let inMemoryProfessionalsRepository: InMemoryProfessionalsRepository;
let inMemoryUserRepository: InMemoryUserRepository;
let subscriptionMiddleware: FakeCheckSubscriptionStatusMiddleware;

describe('Create Patient Service', () => {
  beforeEach(() => {
    inMemoryPatientRepository = new InMemoryPatientRepository();
    inMemoryProfessionalsRepository = new InMemoryProfessionalsRepository();
    inMemoryUserRepository = new InMemoryUserRepository();

    subscriptionMiddleware = new FakeCheckSubscriptionStatusMiddleware();

    sut = new CreatePatientService(
      inMemoryPatientRepository,
      inMemoryUserRepository,
      inMemoryProfessionalsRepository,
      subscriptionMiddleware
    );
  });

  it('should be able to create a patient for an existing user and professional', async () => {
    const user = User.create(
      {
        name: 'John Doe',
        email: 'jhondoe@gmail.com',
        password: '123456',
      },
      new UniqueEntityID('user-01')
    );

    await inMemoryUserRepository.create(user);

    const professional = Professionals.create(
      {
        userId: user.id,
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

    const result = await sut.handle({
      userId: user.id.toString(),
      professionalId: professional.id.toString(),
      name: 'Jane Doe',
      birthDate: '1990-01-01',
      phone: '987654321',
      note: 'note',
    });

    expect(result.isRight()).toBe(true);
    expect(inMemoryPatientRepository.items).toHaveLength(1);
    expect(inMemoryPatientRepository.items[0].userId).toEqual(
      user.id.toString()
    );
    expect(inMemoryPatientRepository.items[0].professionalsId).toEqual(
      professional.id.toString()
    );
  });

  it('should not create a patient when user does not exist', async () => {
    const result = await sut.handle({
      userId: 'user-02',
      professionalId: 'professional-02',
      name: 'Jane Doe',
      birthDate: '1990-01-01',
      phone: '987654321',
      note: 'note',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ErrorUserNotFound);
    }
    expect(inMemoryPatientRepository.items).toHaveLength(0);
  });

  it('should not create a patient when professional does not exist', async () => {
    const user = User.create(
      {
        name: 'John Doe',
        email: 'jhondoe@gmail.com',
        password: '123456',
      },
      new UniqueEntityID('user-01')
    );

    await inMemoryUserRepository.create(user);

    const result = await sut.handle({
      userId: user.id.toString(),
      professionalId: 'professional-03',
      name: 'Jane Doe',
      birthDate: '1990-01-01',
      phone: '987654321',
      note: 'note',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(
        ErrorPatientNotLinkedToProfessional
      );
    }
    expect(inMemoryPatientRepository.items).toHaveLength(0);
  });
});
