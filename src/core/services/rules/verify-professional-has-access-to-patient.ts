import type { PatientRepository } from '../../repositories/patient-repository';
import { type Either, left, right } from '../../utils/either';
import { ErrorPatientNotFound } from '../errors/patient-not-found';
import { ErrorPatientNotLinkedToProfessional } from '../errors/patient-not-linked-to-a-professional';

interface VerifyProfessionalHasAccessToPatientRequest {
  patientId: string;
  professionalId: string;
}

export type VerifyProfessionalHasAccessToPatientResponse = Either<
  ErrorPatientNotFound | ErrorPatientNotLinkedToProfessional,
  null
>;

export class VerifyProfessionalHasAccessToPatient {
  constructor(private patientRepository: PatientRepository) {}

  async execute({
    patientId,
    professionalId,
  }: VerifyProfessionalHasAccessToPatientRequest): Promise<VerifyProfessionalHasAccessToPatientResponse> {
    const patient = await this.patientRepository.findById(patientId);

    if (!patient) {
      return left(new ErrorPatientNotFound());
    }

    if (patient.professionalsId !== professionalId) {
      return left(new ErrorPatientNotLinkedToProfessional(professionalId));
    }

    return right(null);
  }
}
