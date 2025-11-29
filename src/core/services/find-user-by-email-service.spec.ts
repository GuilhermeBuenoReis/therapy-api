import { beforeEach, describe, expect, it } from 'vitest';
import { InMemoryUserRepository } from '../../../test/repositories/in-memory-user-repository';
import { User } from '../entities/user';
import { UserNotFound } from './errors/user-not-found';
import { FindUserByEmailService } from './find-user-by-email-service';

let sut: FindUserByEmailService;
let inMemoryUserRepository: InMemoryUserRepository;

describe('Find User By Email Service', () => {
  beforeEach(() => {
    inMemoryUserRepository = new InMemoryUserRepository();

    sut = new FindUserByEmailService(inMemoryUserRepository);
  });

  it('should be able to find a user by email', async () => {
    const user = User.create({
      name: 'John Doe',
      email: 'jhondoe@gmail.com',
      password: '123456',
    });

    await inMemoryUserRepository.create(user);

    const result = await sut.handle({
      email: 'jhondoe@gmail.com',
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.user.email).toBe('jhondoe@gmail.com');
      expect(result.value.user.name).toBe('John Doe');
    }
  });

  it('should be able return left when user not found', async () => {
    const result = await sut.handle({
      email: 'missing@gmail.com',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(UserNotFound);
    }
  });
});
