import type { ProfessionalsRepository } from '../repositories/professionals-repository';
import { type Either, left, right } from '../utils/either';
import { ErrorProfessionalsNotFound } from './errors/professionals-not-found';

interface DeleteProfessionalsServiceRequest {
  professionalsId: string;
}

type DeleteProfessionalsServiceResponse = Either<ErrorProfessionalsNotFound, {}>;

export class DeleteProfessionalsService {
  constructor(private professionalsRepository: ProfessionalsRepository) {}

  async handle({
    professionalsId,
  }: DeleteProfessionalsServiceRequest): Promise<DeleteProfessionalsServiceResponse> {
    const professionals =
      await this.professionalsRepository.findById(professionalsId);

    if (!professionals) {
      return left(new ErrorProfessionalsNotFound());
    }

    await this.professionalsRepository.delete(professionals);

    return right({});
  }
}
