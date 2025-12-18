import type { Professionals } from '../entities/professionals';
import type { ProfessionalsRepository } from '../repositories/professionals-repository';
import type { UserRepository } from '../repositories/user-repository';
import { type Either, left, right } from '../utils/either';
import { ProfessionalNotFoundError } from './errors/professional-not-found-error';
import { ErrorUserNotFound } from './errors/user-not-found';

export interface FindProfessionalForUserServiceRequest {
  userId: string;
  professionalId: string;
}

type FindProfessionalForUserServiceResponse = Either<
  ProfessionalNotFoundError | ErrorUserNotFound,
  { professional: Professionals }
>;

export class FindProfessionalForUserService {
  constructor(
    private userRepository: UserRepository,
    private professionalRepository: ProfessionalsRepository
  ) {}

  async handle({
    userId,
    professionalId,
  }: FindProfessionalForUserServiceRequest): Promise<FindProfessionalForUserServiceResponse> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      return left(new ErrorUserNotFound());
    }

    const professional =
      await this.professionalRepository.findById(professionalId);

    if (!professional) {
      return left(new ProfessionalNotFoundError());
    }

    return right({
      professional,
    });
  }
}
