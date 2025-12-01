import type { User } from '../entities/user';
import type { UserRepository } from '../repositories/user-repository';
import { type Either, left, right } from '../utils/either';
import { ErrorUserNotFound } from './errors/user-not-found';

export interface FindUserByEmailServiceRequest {
  email: string;
}

type FindUserByEmailServiceResponse = Either<ErrorUserNotFound, { user: User }>;

export class FindUserByEmailService {
  constructor(private userRepository: UserRepository) {}

  async handle({
    email,
  }: FindUserByEmailServiceRequest): Promise<FindUserByEmailServiceResponse> {
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      return left(new ErrorUserNotFound());
    }

    return right({
      user,
    });
  }
}
