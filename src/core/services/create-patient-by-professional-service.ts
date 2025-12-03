import { Patient } from '../entities/patient';
import type { PatientRepository } from '../repositories/patient-repository';
import type { ProfessionalsRepository } from '../repositories/professionals-repository';
import type { UserRepository } from '../repositories/user-repository';
import { type Either, left, right } from '../utils/either';
import { UniqueEntityID } from '../utils/unique-entity-id';
import type { ErrorPatientNotLinkedToProfessional } from './errors/patient-not-linked-to-a-professional';
import { ErrorProfessionalsNotFound } from './errors/professionals-not-found';
import { ErrorUserNotFound } from './errors/user-not-found';

export interface CreatePatientByProfessionalServiceRequest {
  professionalId: string;
  name: string;
  birthDate: string;
  phone: string;
  notes: string;
}

type CreatePatientByProfessionalServiceResponse = Either<
  | ErrorPatientNotLinkedToProfessional
  | ErrorUserNotFound
  | ErrorProfessionalsNotFound,
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
    notes,
    phone,
    professionalId,
  }: CreatePatientByProfessionalServiceRequest): Promise<CreatePatientByProfessionalServiceResponse> {
    const user = await this.userRepository.findById(professionalId);

    if (!user) {
      return left(new ErrorUserNotFound());
    }

    const professional = await this.professionalsRepository.findByUserId(
      user.id.toString()
    );

    if (!professional) {
      return left(new ErrorProfessionalsNotFound());
    }

    const patient = Patient.create(
      {
        userId: user.id.toString(),
        professionalsId: professional.id.toString(),
        name,
        birthDate,
        phone,
        note: notes,
      },
      new UniqueEntityID()
    );

    await this.patientRepository.create(patient);

    return right({
      patient,
    });
  }
}
