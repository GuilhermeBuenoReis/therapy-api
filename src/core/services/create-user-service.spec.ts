import { beforeEach, describe, expect, it } from 'vitest';
import { InMemoryUserRepository } from '../../../test/repositories/in-memory-user-repository';
import { User, UserRole } from '../entities/user';
import { CreateUserService } from './create-user-service';
import { ErrorUserAlreadyExists } from './errors/user-already-exist';

let sut: CreateUserService;
let inMemoryUserRepository: InMemoryUserRepository;

describe('Create User Service', () => {
  beforeEach(() => {
    inMemoryUserRepository = new InMemoryUserRepository();

    sut = new CreateUserService(inMemoryUserRepository);
  });

  it('should be able create a new user', async () => {
    const result = await sut.handle({
      name: 'John Doe',
      email: 'jhondoe@gmail.com',
      password: '123456',
      role: UserRole.Professional
    });

    expect(result.isRight()).toBe(true);
    expect(inMemoryUserRepository.items[0].email).toEqual('jhondoe@gmail.com');
  });

  it('should not be able create a new user with same email', async () => {
    const user = User.create({
      name: 'John Doe',
      email: 'jhondoe@gmail.com',
      password: '123456',
      role: UserRole.Professional
    });

    await inMemoryUserRepository.create(user);

    const result = await sut.handle({
      name: 'John Doe',
      email: 'jhondoe@gmail.com',
      password: '123456',
      role: UserRole.Professional
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ErrorUserAlreadyExists);
    }
    expect(inMemoryUserRepository.items).toHaveLength(1);
    expect(inMemoryUserRepository.items[0].email).toEqual('jhondoe@gmail.com');
  });
});
