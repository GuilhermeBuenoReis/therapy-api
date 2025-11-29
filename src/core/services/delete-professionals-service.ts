import type { ProfessionalsRepository } from '../repositories/professionals-repository';
import { type Either, left, right } from '../utils/either';
import { ProfessionalsNotFound } from './errors/professionals-not-found';

interface DeleteProfessionalsServiceRequest {
  professionalsId: string;
}

type DeleteProfessionalsServiceResponse = Either<ProfessionalsNotFound, {}>;

export class DeleteProfessionalsService {
  constructor(private professionalsRepository: ProfessionalsRepository) {}

  async handle({
    professionalsId,
  }: DeleteProfessionalsServiceRequest): Promise<DeleteProfessionalsServiceResponse> {
    const professionals =
      await this.professionalsRepository.findById(professionalsId);

    if (!professionals) {
      return left(new ProfessionalsNotFound());
    }

    await this.professionalsRepository.delete(professionals);

    return right({});
  }
}
