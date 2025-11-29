import { beforeEach, describe, expect, it } from 'vitest';
import { InMemoryUserRepository } from '../../../test/repositories/in-memory-user-repository';
import { User } from '../entities/user';
import { UniqueEntityID } from '../utils/unique-entity-id';
import { EditUserService } from './edit-user-service';
import { UserNotFound } from './errors/user-not-found';

let sut: EditUserService;
let inMemoryUserRepository: InMemoryUserRepository;

describe('Edit User Service', () => {
  beforeEach(() => {
    inMemoryUserRepository = new InMemoryUserRepository();
    sut = new EditUserService(inMemoryUserRepository);
  });

  it('should be able to edit a user', async () => {
    const userId = new UniqueEntityID('user-01');
    const user = User.create(
      {
        name: 'John Doe',
        email: 'jhondoe@gmail.com',
        password: '123456',
      },
      userId
    );

    await inMemoryUserRepository.create(user);

    const result = await sut.handle({
      userId: userId.toString(),
      name: 'Jane Smith',
      email: 'jane@example.com',
      password: 'new-password',
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.user.name).toBe('Jane Smith');
      expect(result.value.user.email).toBe('jane@example.com');
      expect(result.value.user.password).toBe('new-password');
      expect(result.value.user.id.toString()).toBe('user-01');
      expect(result.value.user.updatedAt).toBeInstanceOf(Date);
    }
  });

  it('should return left when trying to edit a non-existent user', async () => {
    const result = await sut.handle({
      userId: 'missing-id',
      name: 'Jane Smith',
      email: 'jane@example.com',
      password: 'new-password',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(UserNotFound);
    }
  });
});
