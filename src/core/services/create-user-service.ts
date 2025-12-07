import { User, type UserRole } from '../entities/user';
import type { UserRepository } from '../repositories/user-repository';
import { type Either, left, right } from '../utils/either';
import { UniqueEntityID } from '../utils/unique-entity-id';
import { ErrorUserAlreadyExists } from './errors/user-already-exist';

export interface CreateUserServiceRequest {
  name: string;
  email: string;
  password: string;
  role: UserRole
}

type CreateUserServiceResponse = Either<ErrorUserAlreadyExists, { user: User }>;

export class CreateUserService {
  constructor(private userRepository: UserRepository) { }

  async handle({
    name,
    email,
    password,
    role
  }: CreateUserServiceRequest): Promise<CreateUserServiceResponse> {
    const userAlreadyExist = await this.userRepository.findByEmail(email);

    if (userAlreadyExist) {
      return left(new ErrorUserAlreadyExists());
    }

    const user = User.create(
      {
        name,
        email,
        password,
        role
      },
      new UniqueEntityID()
    );

    await this.userRepository.create(user);

    return right({
      user,
    });
  }
}
