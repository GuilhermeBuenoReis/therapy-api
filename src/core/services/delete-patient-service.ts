import type { PatientRepository } from '../repositories/patient-repository';
import { type Either, left, right } from '../utils/either';
import { PatientNotFound } from './errors/patient-not-found';

interface DeletePatientServiceRequest {
  patientId: string;
}

type DeletePatientServiceResponse = Either<PatientNotFound, {}>;

export class DeletePatientService {
  constructor(private patientRepository: PatientRepository) {}

  async handle({
    patientId,
  }: DeletePatientServiceRequest): Promise<DeletePatientServiceResponse> {
    const patient = await this.patientRepository.findById(patientId);

    if (!patient) {
      return left(new PatientNotFound());
    }

    await this.patientRepository.delete(patient);

    return right({});
  }
}
