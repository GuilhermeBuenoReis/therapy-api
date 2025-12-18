import { beforeEach, describe, expect, it } from 'vitest';
import { InMemoryProfessionalsRepository } from '../../../test/repositories/in-memory-professionals-repository';
import { InMemoryUserRepository } from '../../../test/repositories/in-memory-user-repository';
import { Professionals } from '../entities/professionals';
import { User } from '../entities/user';
import { UniqueEntityID } from '../utils/unique-entity-id';
import { ProfessionalNotFoundError } from './errors/professional-not-found-error';
import { ErrorUserNotFound } from './errors/user-not-found';
import { FindProfessionalForUserService } from './find-professional-for-user-service';

let sut: FindProfessionalForUserService;
let inMemoryProfessionalsRepository: InMemoryProfessionalsRepository;
let inMemoryUserRepository: InMemoryUserRepository;

describe('Find Professionals By User Id Service', () => {
  beforeEach(() => {
    inMemoryProfessionalsRepository = new InMemoryProfessionalsRepository();
    inMemoryUserRepository = new InMemoryUserRepository();

    sut = new FindProfessionalForUserService(
      inMemoryUserRepository,
      inMemoryProfessionalsRepository
    );
  });

  it('should be able to find professionals by user id', async () => {
    const user = User.create(
      {
        name: 'John Doe',
        email: 'jhondoe@gmail.com',
        password: '123456',
      },
      new UniqueEntityID('user-01')
    );
    await inMemoryUserRepository.create(user);

    const professionals = Professionals.create(
      {
        userId: user.id,
        biography: 'bio',
        monthlyPrice: 100,
        phone: '123456789',
        pricePerSession: 50,
        registration_number: '123456789',
        sessionDuration: 60,
        specialty: 'specialty',
      },
      new UniqueEntityID('professionals-01')
    );
    await inMemoryProfessionalsRepository.create(professionals);

    const result = await sut.handle({
      userId: user.id.toString(),
      professionalId: professionals.id.toString(),
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.professional.id.toString()).toEqual(
        professionals.id.toString()
      );
    }
  });

  it('should return left when user does not exist', async () => {
    const result = await sut.handle({
      userId: 'missing-user',
      professionalId: 'professionals-01',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ErrorUserNotFound);
    }
  });

  it('should return left when professionals is not found', async () => {
    const user = User.create({
      name: 'John Doe',
      email: 'jhondoe@gmail.com',
      password: '123456',
    });
    await inMemoryUserRepository.create(user);

    const result = await sut.handle({
      userId: user.id.toString(),
      professionalId: 'missing-professional',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ProfessionalNotFoundError);
    }
  });
});
