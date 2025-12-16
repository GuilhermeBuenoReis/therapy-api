import { beforeEach, describe, expect, it } from 'vitest';
import { InMemoryUserRepository } from '../../../test/repositories/in-memory-user-repository';
import { User } from '../entities/user';
import { ConfirmUserPaymentService } from './confirm-user-payment-service';
import { ErrorUserNotFound } from './errors/user-not-found';

let sut: ConfirmUserPaymentService;
let inMemoryUserRepository: InMemoryUserRepository;

describe('Confirm User Payment Service', () => {
  beforeEach(() => {
    inMemoryUserRepository = new InMemoryUserRepository();
    sut = new ConfirmUserPaymentService(inMemoryUserRepository);
  });

  it('should confirm payment for an existing user', async () => {
    const user = User.create({
      name: 'John Doe',
      email: 'jhondoe@gmail.com',
      password: '123456',
    });

    await inMemoryUserRepository.create(user);

    const confirmedAt = new Date('2024-07-15T12:00:00Z');

    const result = await sut.execute({
      userId: user.id.toString(),
      confirmedAt,
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.user.hasCompletedPayment).toBe(true);
      expect(result.value.user.paymentConfirmedAt?.toISOString()).toEqual(
        confirmedAt.toISOString()
      );
    }
  });

  it('should return error when user is not found', async () => {
    const result = await sut.execute({
      userId: 'non-existent-user',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ErrorUserNotFound);
    }
  });
});
