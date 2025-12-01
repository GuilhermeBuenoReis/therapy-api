import type { User } from '../entities/user';
import type { UserRepository } from '../repositories/user-repository';
import { type Either, left, right } from '../utils/either';
import { ErrorUserNotFound } from './errors/user-not-found';

export interface FindUserByIdServiceRequest {
  userId: string;
}

type FindUserByIdServiceResponse = Either<ErrorUserNotFound, { user: User }>;

export class FindUserByIdService {
  constructor(private userRepository: UserRepository) {}

  async handle({
    userId,
  }: FindUserByIdServiceRequest): Promise<FindUserByIdServiceResponse> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      return left(new ErrorUserNotFound());
    }

    return right({
      user,
    });
  }
}
