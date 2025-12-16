import { beforeEach, describe, expect, it } from 'vitest';
import { FakeHasher } from '../../../test/cryptography/fake-hasher';
import { InMemoryUserRepository } from '../../../test/repositories/in-memory-user-repository';
import { User, UserRole } from '../entities/user';
import { UniqueEntityID } from '../utils/unique-entity-id';
import { EditUserService } from './edit-user-service';
import { ErrorUserAlreadyExists } from './errors/user-already-exist';
import { ErrorUserNotFound } from './errors/user-not-found';

let sut: EditUserService;
let inMemoryUserRepository: InMemoryUserRepository;
let fakeHasher: FakeHasher;

describe('Edit User Service', () => {
  beforeEach(() => {
    inMemoryUserRepository = new InMemoryUserRepository();
    fakeHasher = new FakeHasher();
    sut = new EditUserService(inMemoryUserRepository, fakeHasher);
  });

  it('should update provided fields and hash the password when present', async () => {
    const userId = new UniqueEntityID('user-01');
    const user = User.create(
      {
        name: 'John Doe',
        email: 'jhondoe@gmail.com',
        password: '123456',
        role: UserRole.Patient,
      },
      userId
    );

    await inMemoryUserRepository.create(user);

    const result = await sut.handle({
      userId: userId.toString(),
      name: 'Jane Smith',
      email: 'jane@example.com',
      password: 'new-password',
      role: UserRole.Professional,
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      const updatedUser = result.value.user;
      expect(updatedUser.name).toBe('Jane Smith');
      expect(updatedUser.email).toBe('jane@example.com');
      expect(updatedUser.role).toBe(UserRole.Professional);
      expect(updatedUser.password).toBe('new-password_hashed');
      expect(updatedUser.updatedAt).toBeInstanceOf(Date);
    }
  });

  it('should allow updating a subset of fields', async () => {
    const userId = new UniqueEntityID('user-02');
    const user = User.create(
      {
        name: 'Alice',
        email: 'alice@example.com',
        password: 'alice-password',
      },
      userId
    );

    await inMemoryUserRepository.create(user);

    const result = await sut.handle({
      userId: userId.toString(),
      name: 'Alice Updated',
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      const updated = result.value.user;
      expect(updated.name).toBe('Alice Updated');
      expect(updated.email).toBe('alice@example.com');
      expect(updated.password).toBe('alice-password');
    }
  });

  it('should return conflict when email already exists on another user', async () => {
    const firstUser = User.create({
      name: 'User One',
      email: 'one@example.com',
      password: 'one',
    });
    const secondUser = User.create({
      name: 'User Two',
      email: 'two@example.com',
      password: 'two',
    }, new UniqueEntityID('user-02'));

    await inMemoryUserRepository.create(firstUser);
    await inMemoryUserRepository.create(secondUser);

    const result = await sut.handle({
      userId: secondUser.id.toString(),
      email: 'one@example.com',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ErrorUserAlreadyExists);
    }
  });

  it('should return left when trying to edit a non-existent user', async () => {
    const result = await sut.handle({
      userId: 'missing-id',
      name: 'Jane Smith',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ErrorUserNotFound);
    }
  });
});
