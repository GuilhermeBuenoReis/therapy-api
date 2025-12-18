import type { Patient } from '../entities/patient';
import type { Professionals } from '../entities/professionals';
import type { User } from '../entities/user';
import type { PatientRepository } from '../repositories/patient-repository';
import type { ProfessionalsRepository } from '../repositories/professionals-repository';
import type { UserRepository } from '../repositories/user-repository';
import { type Either, left, right } from '../utils/either';
import type { ErrorPatientNotLinkedToProfessional } from './errors/patient-not-linked-to-a-professional';
import { ProfessionalNotFoundError } from './errors/professional-not-found-error';
import { ErrorUserNotFound } from './errors/user-not-found';
import { createPatientEntity } from './patient-builder';

export interface CreatePatientByProfessionalServiceRequest {
  professionalId: string;
  name: string;
  birthDate: string;
  phone: string;
  note?: string;
}

type CreatePatientByProfessionalServiceResponse = Either<
  | ErrorPatientNotLinkedToProfessional
  | ErrorUserNotFound
  | ProfessionalNotFoundError,
  { patient: Patient }
>;

export class CreatePatientByProfessionalService {
  constructor(
    private patientRepository: PatientRepository,
    private userRepository: UserRepository,
    private professionalsRepository: ProfessionalsRepository
  ) {}

  async handle({
    name,
    birthDate,
    note,
    phone,
    professionalId,
  }: CreatePatientByProfessionalServiceRequest): Promise<CreatePatientByProfessionalServiceResponse> {
    const userResult = await this.getUser(professionalId);
    if (userResult.isLeft()) {
      return left(userResult.value);
    }
    const professionalResult = await this.getProfessionalByUser(
      userResult.value.id.toString()
    );
    if (professionalResult.isLeft()) {
      return left(professionalResult.value);
    }
    const professional = professionalResult.value;

    const patient = createPatientEntity({
      userId: userResult.value.id.toString(),
      professionalId: professional.id.toString(),
      name,
      birthDate,
      phone,
      note: note ?? '',
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

  private async getProfessionalByUser(
    userId: string
  ): Promise<Either<ProfessionalNotFoundError, Professionals>> {
    const professional = await this.professionalsRepository.findByUserId(
      userId
    );

    if (!professional) {
      return left(new ProfessionalNotFoundError());
    }

    return right(professional);
  }
}
