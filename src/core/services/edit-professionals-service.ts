import type { Professionals } from '../entities/professionals';
import type { ProfessionalsRepository } from '../repositories/professionals-repository';
import { type Either, left, right } from '../utils/either';
import { ErrorProfessionalsNotFound } from './errors/professionals-not-found';

interface EditProfessionalsServiceRequest {
  professionalsId: string;
  specialty: string;
  registration_number: string;
  phone: string;
  biography: string;
  pricePerSession: number;
  monthlyPrice: number;
  sessionDuration: number;
}

type EditProfessionalsServiceResponse = Either<
  ErrorProfessionalsNotFound,
  {
    professionals: Professionals;
  }
>;

export class EditProfessionalsService {
  constructor(private professionalsRepository: ProfessionalsRepository) {}

  async handle({
    professionalsId,
    biography,
    monthlyPrice,
    phone,
    pricePerSession,
    registration_number,
    sessionDuration,
    specialty,
  }: EditProfessionalsServiceRequest): Promise<EditProfessionalsServiceResponse> {
    const professionals =
      await this.professionalsRepository.findById(professionalsId);

    if (!professionals) {
      return left(new ErrorProfessionalsNotFound());
    }

    professionals.specialty = specialty;
    professionals.registration_number = registration_number;
    professionals.phone = phone;
    professionals.biography = biography;
    professionals.pricePerSession = pricePerSession;
    professionals.monthlyPrice = monthlyPrice;
    professionals.sessionDuration = sessionDuration;

    await this.professionalsRepository.save(professionals);

    return right({
      professionals,
    });
  }
}
