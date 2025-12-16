import type { User } from '../entities/user';
import type { UserRepository } from '../repositories/user-repository';
import { type Either, left, right } from '../utils/either';
import { ErrorUserNotFound } from './errors/user-not-found';

export interface ConfirmUserPaymentServiceRequest {
  userId: string;
  confirmedAt?: Date;
}

type ConfirmUserPaymentServiceResponse = Either<
  ErrorUserNotFound,
  {
    user: User;
  }
>;

export class ConfirmUserPaymentService {
  constructor(private userRepository: UserRepository) {}

  async execute({
    userId,
    confirmedAt,
  }: ConfirmUserPaymentServiceRequest): Promise<ConfirmUserPaymentServiceResponse> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      return left(new ErrorUserNotFound());
    }

    const timestamp = confirmedAt ?? new Date();
    user.markPaymentAsCompleted(timestamp);

    await this.userRepository.save(user);

    return right({
      user,
    });
  }
}
