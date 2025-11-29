import type { UserRepository } from '../repositories/user-repository';
import { type Either, left, right } from '../utils/either';
import { UserNotFound } from './errors/user-not-found';

interface DeleteUserServiceRequest {
  userId: string;
}

type DeleteUserServiceResponse = Either<UserNotFound, {}>;

export class DeleteUserService {
  constructor(private userRepository: UserRepository) {}

  async handle({
    userId,
  }: DeleteUserServiceRequest): Promise<DeleteUserServiceResponse> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      return left(new UserNotFound());
    }

    await this.userRepository.delete(user);

    return right({});
  }
}
