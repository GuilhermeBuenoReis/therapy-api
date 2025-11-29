import type { Professionals } from '../entities/professionals';
import type { ProfessionalsRepository } from '../repositories/professionals-repository';
import type { UserRepository } from '../repositories/user-repository';
import { type Either, left, right } from '../utils/either';
import { ProfessionalsNotFound } from './errors/professionals-not-found';
import { UserNotFound } from './errors/user-not-found';

export interface FindProfessionalsByUserIdServiceRequest {
  userId: string;
  professionalId: string;
}

type FindProfessionalsByUserIdServiceResponse = Either<
  ProfessionalsNotFound | UserNotFound,
  { professional: Professionals }
>;

export class FindProfessionalsByUserIdService {
  constructor(
    private userRepository: UserRepository,
    private professionalRepository: ProfessionalsRepository
  ) {}

  async handle({
    userId,
    professionalId,
  }: FindProfessionalsByUserIdServiceRequest): Promise<FindProfessionalsByUserIdServiceResponse> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      return left(new UserNotFound());
    }

    const professional =
      await this.professionalRepository.findById(professionalId);

    if (!professional) {
      return left(new ProfessionalsNotFound());
    }

    return right({
      professional,
    });
  }
}
