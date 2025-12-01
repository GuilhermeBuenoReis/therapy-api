import { Patient } from '../entities/patient';
import type { PatientRepository } from '../repositories/patient-repository';
import type { ProfessionalsRepository } from '../repositories/professionals-repository';
import type { UserRepository } from '../repositories/user-repository';
import { type Either, left, right } from '../utils/either';
import { UniqueEntityID } from '../utils/unique-entity-id';
import { PatientNotLinkedToAProfessional } from './errors/patient-not-linked-to-a-professional';
import { UserNotFound } from './errors/user-not-found';

export interface CreatePatientServiceRequest {
  userId: string;
  patientId: string;
  name: string;
  birthDate: string;
  phone: string;
  note: string;
}

type CreatePatientServiceResponse = Either<
  PatientNotLinkedToAProfessional | UserNotFound,
  { patient: Patient }
>;

export class CreatePatientService {
  constructor(
    private patientRepository: PatientRepository,
    private userRepository: UserRepository,
    private professionalsRepository: ProfessionalsRepository
  ) {}

  async handle({
    userId,
    patientId,
    name,
    note,
    phone,
    birthDate,
  }: CreatePatientServiceRequest): Promise<CreatePatientServiceResponse> {
    const user = await this.userRepository.findById(userId);
    const professionals =
      await this.professionalsRepository.findById(patientId);

    if (!user) {
      return left(new UserNotFound());
    }

    if (!professionals) {
      return left(new PatientNotLinkedToAProfessional(patientId));
    }

    const patient = Patient.create(
      {
        userId: user.id.toString(),
        professionalsId: professionals.id.toString(),
        name,
        note,
        phone,
        birthDate,
      },
      new UniqueEntityID()
    );

    await this.patientRepository.create(patient);

    return right({
      patient,
    });
  }
}
