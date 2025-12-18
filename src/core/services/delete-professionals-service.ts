import type { ProfessionalsRepository } from '../repositories/professionals-repository';
import { type Either, left, right } from '../utils/either';
import { ProfessionalNotFoundError } from './errors/professional-not-found-error';

interface DeleteProfessionalsServiceRequest {
  professionalsId: string;
}

type DeleteProfessionalsServiceResponse = Either<ProfessionalNotFoundError, {}>;

export class DeleteProfessionalsService {
  constructor(private professionalsRepository: ProfessionalsRepository) {}

  async handle({
    professionalsId,
  }: DeleteProfessionalsServiceRequest): Promise<DeleteProfessionalsServiceResponse> {
    const professionals =
      await this.professionalsRepository.findById(professionalsId);

    if (!professionals) {
      return left(new ProfessionalNotFoundError());
    }

    await this.professionalsRepository.delete(professionals);

    return right({});
  }
}
