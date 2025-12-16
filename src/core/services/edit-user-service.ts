import type { User } from '../entities/user';
import type { UserRepository } from '../repositories/user-repository';
import type { HashGenerator } from '../utils/cryptography/hash-generator';
import { type Either, left, right } from '../utils/either';
import { ErrorUserAlreadyExists } from './errors/user-already-exist';
import { ErrorUserNotFound } from './errors/user-not-found';

interface EditUserServiceRequest {
  userId: string;
  name?: string;
  email?: string;
  password?: string;
  role?: User['role'];
}

type EditUserServiceResponse = Either<
  ErrorUserNotFound | ErrorUserAlreadyExists,
  {
    user: User;
  }
>;

export class EditUserService {
  constructor(
    private userRepository: UserRepository,
    private hashGenerator: HashGenerator
  ) {}

  async handle({
    userId,
    email,
    name,
    password,
    role,
  }: EditUserServiceRequest): Promise<EditUserServiceResponse> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      return left(new ErrorUserNotFound());
    }

    if (email && email !== user.email) {
      const userWithEmail = await this.userRepository.findByEmail(email);
      if (userWithEmail && userWithEmail.id.toString() !== user.id.toString()) {
        return left(new ErrorUserAlreadyExists());
      }

      user.email = email;
    }

    if (name) {
      user.name = name;
    }

    if (role) {
      user.role = role;
    }

    if (password) {
      const hashedPassword = await this.hashGenerator.hash(password);
      user.password = hashedPassword;
    }

    await this.userRepository.save(user);

    return right({
      user,
    });
  }
}
