import { type User, UserRole } from '../entities/user';
import type {
  AuthSessionGateway,
  AuthSessionPayload,
} from '../middleware/auth-session-middleware';
import type { ProfessionalsRepository } from '../repositories/professionals-repository';
import type { UserRepository } from '../repositories/user-repository';
import type { HashComparer } from '../utils/cryptography/hash-comparer';
import { type Either, left, right } from '../utils/either';
import { ProfessionalProfileNotFoundError } from './errors/professional-profile-not-found-error';
import { ProfessionalRoleRequiredError } from './errors/professional-role-required-error';
import { WrongCredentialsError } from './errors/wrong-creadentials-error';

interface AuthenticateProfessionalServiceRequest {
  email: string;
  password: string;
}

type AuthenticateProfessionalServiceResponse = Either<
  | WrongCredentialsError
  | ProfessionalRoleRequiredError
  | ProfessionalProfileNotFoundError,
  {
    sessionToken: string;
    sessionExpiresAt?: Date;
    authenticatedUser: AuthSessionPayload;
  }
>;

export class AuthenticateProfessionalService {
  constructor(
    private userRepository: UserRepository,
    private professionalsRepository: ProfessionalsRepository,
    private hashCompare: HashComparer,
    private authSessionGateway: AuthSessionGateway
  ) {}

  async execute({
    email,
    password,
  }: AuthenticateProfessionalServiceRequest): Promise<AuthenticateProfessionalServiceResponse> {
    const userResult = await this.authenticateCredentials({
      email,
      password,
    });

    if (userResult.isLeft()) {
      return left(userResult.value);
    }

    const user = userResult.value;

    if (user.role !== UserRole.Professional) {
      return left(new ProfessionalRoleRequiredError());
    }

    const professional = await this.professionalsRepository.findByUserId(
      user.id.toString()
    );

    if (!professional) {
      return left(new ProfessionalProfileNotFoundError());
    }

    const sessionPayload: AuthSessionPayload = {
      userId: user.id.toString(),
      professionalId: professional.id.toString(),
      role: user.role,
      email: user.email,
    };

    const session = await this.authSessionGateway.createSession(sessionPayload);

    return right({
      sessionToken: session.token,
      sessionExpiresAt: session.expiresAt,
      authenticatedUser: sessionPayload,
    });
  }

  private async authenticateCredentials({
    email,
    password,
  }: AuthenticateProfessionalServiceRequest): Promise<
    Either<WrongCredentialsError, User>
  > {
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      return left(new WrongCredentialsError());
    }

    const matches = await this.hashCompare.compare(password, user.password);

    if (!matches) {
      return left(new WrongCredentialsError());
    }

    return right(user);
  }
}
