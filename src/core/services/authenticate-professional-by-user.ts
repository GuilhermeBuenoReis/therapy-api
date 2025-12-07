import type { ProfessionalsRepository } from '../repositories/professionals-repository';
import type { UserRepository } from '../repositories/user-repository';
import type { Encrypter } from '../utils/cryptography/encrypter';
import type { HashComparer } from '../utils/cryptography/hash-comparer';
import { left, right, type Either } from '../utils/either';
import { WrongCredentialsError } from './errors/wrong-creadentials-error';


interface AuthenticateProfessionalUseCaseRequest {
  email: string;
  password: string;
}

type AuthenticateProfessionalUseCaseResponse = Either<
  WrongCredentialsError,
  {
    accessToken: string;
  }
>;

export class AuthenticateProfessionalUseCase {
  constructor(
    private userRepository: UserRepository,
    private hashCompare: HashComparer,
    private encrypter: Encrypter
  ) { }

  async execute({
    email,
    password,
  }: AuthenticateProfessionalUseCaseRequest): Promise<AuthenticateProfessionalUseCaseResponse> {
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      return left(new WrongCredentialsError());
    }

    const isPasswordValid = await this.hashCompare.compare(
      password,
      user.password
    );

    if (!isPasswordValid) {
      return left(new WrongCredentialsError());
    }

    const accessToken = await this.encrypter.encrypt({
      sub: user.id.toString(),
    });

    return right({
      accessToken,
    });
  }
}