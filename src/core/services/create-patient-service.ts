import type { Professionals } from '../entities/professionals';
import type { Patient } from '../entities/patient';
import type { User } from '../entities/user';
import type { PatientRepository } from '../repositories/patient-repository';
import type { ProfessionalsRepository } from '../repositories/professionals-repository';
import type { UserRepository } from '../repositories/user-repository';
import { type Either, left, right } from '../utils/either';
import { ErrorPatientNotLinkedToProfessional } from './errors/patient-not-linked-to-a-professional';
import { ErrorUserNotFound } from './errors/user-not-found';
import type {
  SubscriptionAccessMiddleware,
  SubscriptionMiddlewareError,
} from './rules/check-subscription-status-middleware';
import { createPatientEntity } from './patient-builder';

export interface CreatePatientServiceRequest {
  userId: string;
  professionalId: string;
  name: string;
  birthDate: string;
  phone: string;
  note?: string;
}

type CreatePatientServiceResponse = Either<
  | ErrorPatientNotLinkedToProfessional
  | ErrorUserNotFound
  | SubscriptionMiddlewareError,
  { patient: Patient }
>;

export class CreatePatientService {
  constructor(
    private patientRepository: PatientRepository,
    private userRepository: UserRepository,
    private professionalsRepository: ProfessionalsRepository,
    private subscriptionMiddleware: SubscriptionAccessMiddleware
  ) {}

  async handle({
    userId,
    professionalId,
    name,
    note,
    phone,
    birthDate,
  }: CreatePatientServiceRequest): Promise<CreatePatientServiceResponse> {
    const userResult = await this.getUser(userId);
    if (userResult.isLeft()) {
      return left(userResult.value);
    }
    const user = userResult.value;

    const professionalResult = await this.getProfessional(professionalId);
    if (professionalResult.isLeft()) {
      return left(professionalResult.value);
    }
    const professional = professionalResult.value;

    const subscriptionResult = await this.subscriptionMiddleware.enforceAccess({
      professionalId: professional.id.toString(),
      operation: 'write',
    });
    if (subscriptionResult.isLeft()) {
      return left(subscriptionResult.value);
    }

    const patient = createPatientEntity({
      userId: user.id.toString(),
      professionalId: professional.id.toString(),
      name,
      note: note ?? '',
      phone,
      birthDate,
    });

    await this.patientRepository.create(patient);

    return right({
      patient,
    });
  }

  private async getUser(
    userId: string
  ): Promise<Either<ErrorUserNotFound, User>> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      return left(new ErrorUserNotFound());
    }

    return right(user);
  }

  private async getProfessional(
    professionalId: string
  ): Promise<Either<ErrorPatientNotLinkedToProfessional, Professionals>> {
    const professional = await this.professionalsRepository.findById(
      professionalId
    );

    if (!professional) {
      return left(new ErrorPatientNotLinkedToProfessional(professionalId));
    }

    return right(professional);
  }
}
