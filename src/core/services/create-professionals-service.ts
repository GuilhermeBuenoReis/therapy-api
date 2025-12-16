import { Professionals } from '../entities/professionals';
import type { ProfessionalsRepository } from '../repositories/professionals-repository';
import type { UserRepository } from '../repositories/user-repository';
import { type Either, left, right } from '../utils/either';
import { UniqueEntityID } from '../utils/unique-entity-id';
import { ErrorUserNotFound } from './errors/user-not-found';
import { PaymentConfirmationRequiredError } from './errors/payment-confirmation-required-error';

export interface CreateProfessionalsServiceRequest {
  userId: string;
  specialty: string;
  registration_number: string;
  phone: string;
  biography: string;
  pricePerSession: number;
  monthlyPrice: number;
  sessionDuration: number;
}

type CreateProfessionalsServiceResponse = Either<
  ErrorUserNotFound | PaymentConfirmationRequiredError,
  { professionals: Professionals }
>;

export class CreateProfessionalsService {
  constructor(
    private professionalsRepository: ProfessionalsRepository,
    private userRepository: UserRepository
  ) {}

  async handle({
    userId,
    biography,
    monthlyPrice,
    phone,
    pricePerSession,
    registration_number,
    sessionDuration,
    specialty,
  }: CreateProfessionalsServiceRequest): Promise<CreateProfessionalsServiceResponse> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      return left(new ErrorUserNotFound());
    }

    if (!user.hasCompletedPayment) {
      return left(new PaymentConfirmationRequiredError());
    }

    const professionals = Professionals.create(
      {
        userId: user.id,
        biography,
        monthlyPrice,
        phone,
        pricePerSession,
        registration_number,
        sessionDuration,
        specialty,
      },
      new UniqueEntityID()
    );

    await this.professionalsRepository.create(professionals);

    return right({
      professionals,
    });
  }
}
