import type { Patient } from '../entities/patient';
import type { PatientRepository } from '../repositories/patient-repository';
import type { UserRepository } from '../repositories/user-repository';
import { type Either, left, right } from '../utils/either';
import { ErrorPatientNotFound } from './errors/patient-not-found';
import { ErrorUserNotFound } from './errors/user-not-found';

export interface FindPatientByUserIdServiceRequest {
  userId: string;
}

type FindPatientByUserIdServiceResponse = Either<
  ErrorPatientNotFound | ErrorUserNotFound,
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
      return left(new ErrorUserNotFound());
    }

    const patient = await this.patientRepository.findByUserId(userId);

    if (!patient) {
      return left(new ErrorPatientNotFound());
    }

    return right({
      patient,
    });
  }
}
