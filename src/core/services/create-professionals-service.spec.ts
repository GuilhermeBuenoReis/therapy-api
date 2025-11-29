import { beforeEach, describe, expect, it } from 'vitest';
import { InMemoryProfessionalsRepository } from '../../../test/repositories/in-memory-professionals-repository';
import { InMemoryUserRepository } from '../../../test/repositories/in-memory-user-repository';
import { User } from '../entities/user';
import { UniqueEntityID } from '../utils/unique-entity-id';
import { CreateProfessionalsService } from './create-professionals-service';
import { UserNotFound } from './errors/user-not-found';

let sut: CreateProfessionalsService;
let inMemoryProfessionalsRepository: InMemoryProfessionalsRepository;
let inMemoryUserRepository: InMemoryUserRepository;

describe('Create Professionals Service', () => {
  beforeEach(() => {
    inMemoryProfessionalsRepository = new InMemoryProfessionalsRepository();
    inMemoryUserRepository = new InMemoryUserRepository();

    sut = new CreateProfessionalsService(
      inMemoryProfessionalsRepository,
      inMemoryUserRepository
    );
  });

  it('should be able create professionals for an existing user', async () => {
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
      biography: 'bio',
      monthlyPrice: 100,
      phone: '123456789',
      pricePerSession: 50,
      registration_number: '123456789',
      sessionDuration: 60,
      specialty: 'specialty',
    });

    expect(result.isRight()).toBe(true);
    expect(inMemoryProfessionalsRepository.items).toHaveLength(1);
    expect(inMemoryProfessionalsRepository.items[0].userId.toString()).toEqual(
      user.id.toString()
    );
  });

  it('should not create a professional when user does not exist', async () => {
    const result = await sut.handle({
      userId: 'user-02',
      biography: 'bio',
      monthlyPrice: 100,
      phone: '123456789',
      pricePerSession: 50,
      registration_number: '123456789',
      sessionDuration: 60,
      specialty: 'specialty',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(UserNotFound);
    }

    expect(inMemoryProfessionalsRepository.items).toHaveLength(0);
  });
});
