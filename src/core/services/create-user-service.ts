import { User, type UserRole } from '../entities/user';
import type { UserRepository } from '../repositories/user-repository';
import type { HashGenerator } from '../utils/cryptography/hash-generator';
import { type Either, left, right } from '../utils/either';
import { UniqueEntityID } from '../utils/unique-entity-id';
import { ErrorUserAlreadyExists } from './errors/user-already-exist';

export interface CreateUserServiceRequest {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

type CreateUserServiceResponse = Either<ErrorUserAlreadyExists, { user: User }>;

export class CreateUserService {
  constructor(
    private userRepository: UserRepository,
    private hashGenerator: HashGenerator
  ) {}

  async handle({
    name,
    email,
    password,
    role,
  }: CreateUserServiceRequest): Promise<CreateUserServiceResponse> {
    const userAlreadyExist = await this.userRepository.findByEmail(email);

    if (userAlreadyExist) {
      return left(new ErrorUserAlreadyExists());
    }

    const isAlreadyHashed = password.startsWith('$2');
    const hashedPassword = isAlreadyHashed
      ? password
      : await this.hashGenerator.hash(password);

    const user = User.create(
      {
        name,
        email,
        password: hashedPassword,
        role,
      },
      new UniqueEntityID()
    );

    await this.userRepository.create(user);

    return right({
      user,
    });
  }
}
