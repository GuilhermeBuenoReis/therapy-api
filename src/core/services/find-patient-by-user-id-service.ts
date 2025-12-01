import type { Patient } from '../entities/patient';
import type { PatientRepository } from '../repositories/patient-repository';
import type { UserRepository } from '../repositories/user-repository';
import { type Either, left, right } from '../utils/either';
import { PatientNotFound } from './errors/patient-not-found';
import { UserNotFound } from './errors/user-not-found';

export interface FindPatientByUserIdServiceRequest {
  userId: string;
}

type FindPatientByUserIdServiceResponse = Either<
  PatientNotFound | UserNotFound,
  { patient: Patient }
>;

export class FindPatientByUserIdService {
  constructor(
    private patientRepository: PatientRepository,
    private userRepository: UserRepository
  ) {}

  async handle({
    userId,
  }: FindPatientByUserIdServiceRequest): Promise<FindPatientByUserIdServiceResponse> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      return left(new UserNotFound());
    }

    const patient = await this.patientRepository.findByUserId(userId);

    if (!patient) {
      return left(new PatientNotFound());
    }

    return right({
      patient,
    });
  }
}
