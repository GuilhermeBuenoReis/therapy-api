import type { Patient } from '../entities/patient';
import type { PatientRepository } from '../repositories/patient-repository';
import { type Either, left, right } from '../utils/either';
import { PatientNotFound } from './errors/patient-not-found';

export interface FindPatientByProfessionalIdServiceRequest {
  professionalId: string;
}

type FindPatientByProfessionalIdServiceResponse = Either<
  PatientNotFound,
  { patient: Patient }
>;

export class FindPatientByProfessionalIdService {
  constructor(private patientRepository: PatientRepository) {}

  async handle({
    professionalId,
  }: FindPatientByProfessionalIdServiceRequest): Promise<FindPatientByProfessionalIdServiceResponse> {
    const patient =
      await this.patientRepository.findByProfessionalsId(professionalId);

    if (!patient) {
      return left(new PatientNotFound());
    }

    return right({
      patient,
    });
  }
}
