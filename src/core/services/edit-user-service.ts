import type { User } from '../entities/user';
import type { UserRepository } from '../repositories/user-repository';
import { type Either, left, right } from '../utils/either';
import { ErrorUserNotFound } from './errors/user-not-found';

interface EditUserServiceRequest {
  userId: string;
  name: string;
  email: string;
  password: string;
}

type EditUserServiceResponse = Either<
  ErrorUserNotFound,
  {
    user: User;
  }
>;

export class EditUserService {
  constructor(private userRepository: UserRepository) {}

  async handle({
    userId,
    email,
    name,
    password,
  }: EditUserServiceRequest): Promise<EditUserServiceResponse> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      return left(new ErrorUserNotFound());
    }

    user.name = name;
    user.email = email;
    user.password = password;

    await this.userRepository.save(user);

    return right({
      user,
    });
  }
}
