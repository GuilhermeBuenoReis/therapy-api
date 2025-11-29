import { beforeEach, describe, expect, it } from 'vitest';
import { InMemoryUserRepository } from '../../../test/repositories/in-memory-user-repository';
import { User } from '../entities/user';
import { UniqueEntityID } from '../utils/unique-entity-id';
import { DeleteUserService } from './delete-user-service';
import { UserNotFound } from './errors/user-not-found';

let sut: DeleteUserService;
let inMemoryUserRepository: InMemoryUserRepository;

describe('Delete User Service', () => {
  beforeEach(() => {
    inMemoryUserRepository = new InMemoryUserRepository();
    sut = new DeleteUserService(inMemoryUserRepository);
  });

  it('should be able to delete a user', async () => {
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
    });

    expect(result.isRight()).toBe(true);
    expect(inMemoryUserRepository.items).toHaveLength(0);
  });

  it('should return left when user does not exist', async () => {
    const result = await sut.handle({
      userId: 'missing-id',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(UserNotFound);
    }
  });
});
