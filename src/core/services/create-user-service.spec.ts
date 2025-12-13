import { beforeEach, describe, expect, it } from 'vitest';
import { InMemoryUserRepository } from '../../../test/repositories/in-memory-user-repository';
import { FakeHasher } from '../../../test/cryptography/fake-hasher';
import { User, UserRole } from '../entities/user';
import { CreateUserService } from './create-user-service';
import { ErrorUserAlreadyExists } from './errors/user-already-exist';

let sut: CreateUserService;
let inMemoryUserRepository: InMemoryUserRepository;
let fakeHasher: FakeHasher;

describe('Create User Service', () => {
  beforeEach(() => {
    inMemoryUserRepository = new InMemoryUserRepository();
    fakeHasher = new FakeHasher();
    sut = new CreateUserService(inMemoryUserRepository, fakeHasher);
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
    expect(inMemoryUserRepository.items[0].password).toEqual('123456_hashed');
  });

  it('should not hash a password that already looks hashed', async () => {
    const result = await sut.handle({
      name: 'Jane Doe',
      email: 'janedoe@gmail.com',
      password: '$2a$10$alreadyHashedPasswordValueForTest..............',
      role: UserRole.Patient,
    });

    expect(result.isRight()).toBe(true);
    expect(inMemoryUserRepository.items[0].password).toEqual(
      '$2a$10$alreadyHashedPasswordValueForTest..............'
    );
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
