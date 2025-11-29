import { User } from '../entities/user';
import type { UserRepository } from '../repositories/user-repository';
import { type Either, left, right } from '../utils/either';
import { UniqueEntityID } from '../utils/unique-entity-id';
import { UserAlreadyExist } from './errors/user-already-exist';

export interface CreateUserServiceRequest {
  name: string;
  email: string;
  password: string;
}

type CreateUserServiceResponse = Either<UserAlreadyExist, { user: User }>;

export class CreateUserService {
  constructor(private userRepository: UserRepository) {}

  async handle({
    name,
    email,
    password,
  }: CreateUserServiceRequest): Promise<CreateUserServiceResponse> {
    const userAlreadyExist = await this.userRepository.findByEmail(email);

    if (userAlreadyExist) {
      return left(new UserAlreadyExist());
    }

    const user = User.create(
      {
        name,
        email,
        password,
      },
      new UniqueEntityID()
    );

    await this.userRepository.create(user);

    return right({
      user,
    });
  }
}
