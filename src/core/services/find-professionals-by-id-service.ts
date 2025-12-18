import type { Professionals } from '../entities/professionals';
import type { ProfessionalsRepository } from '../repositories/professionals-repository';
import { type Either, left, right } from '../utils/either';
import { ProfessionalNotFoundError } from './errors/professional-not-found-error';

export interface FindProfessionalsByIdServiceRequest {
  professionalId: string;
}

type FindProfessionalsByIdServiceResponse = Either<
  ProfessionalNotFoundError,
  { professional: Professionals }
>;

export class FindProfessionalsByIdService {
  constructor(private professionalRepository: ProfessionalsRepository) {}

  async handle({
    professionalId,
  }: FindProfessionalsByIdServiceRequest): Promise<FindProfessionalsByIdServiceResponse> {
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
