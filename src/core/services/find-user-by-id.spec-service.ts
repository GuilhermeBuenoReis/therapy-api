import { beforeEach, describe, expect, it } from 'vitest';
import { InMemoryUserRepository } from '../../../test/repositories/in-memory-user-repository';
import { User } from '../entities/user';
import { UniqueEntityID } from '../utils/unique-entity-id';
import { UserNotFound } from './errors/user-not-found';
import { FindUserByIdService } from './find-user-by-id-service';

let sut: FindUserByIdService;
let inMemoryUserRepository: InMemoryUserRepository;

describe('Find User By Id Service', () => {
  beforeEach(() => {
    inMemoryUserRepository = new InMemoryUserRepository();

    sut = new FindUserByIdService(inMemoryUserRepository);
  });

  it('should be able to find a user by id', async () => {
    const userId = 'user-01';

    const user = User.create(
      {
        name: 'John Doe',
        email: 'jhondoe@gmail.com',
        password: '123456',
      },
      new UniqueEntityID(userId)
    );

    await inMemoryUserRepository.create(user);

    const result = await sut.handle({
      userId,
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.user.name).toBe('John Doe');
      expect(result.value.user.id.toString()).toEqual(userId);
    }
  });

  it('should be able return left when user not found', async () => {
    const result = await sut.handle({
      userId: 'missing-id',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(UserNotFound);
    }
  });
});
