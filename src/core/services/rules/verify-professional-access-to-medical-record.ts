import type { PatientRepository } from '../../repositories/patient-repository';
import { ErrorPatientNotFound } from '../../services/errors/patient-not-found';
import { ErrorPatientNotLinkedToProfessional } from '../../services/errors/patient-not-linked-to-a-professional';
import { type Either, left, right } from '../../utils/either';

interface VerifyProfessionalAccessToMedicalRecordRequest {
  patientId: string;
  professionalId: string;
}

export type VerifyProfessionalAccessToMedicalRecordResponse = Either<
  ErrorPatientNotFound | ErrorPatientNotLinkedToProfessional,
  {}
>;

export class VerifyProfessionalAccessToMedicalRecord {
  constructor(private patientRepository: PatientRepository) {}

  async execute({
    patientId,
    professionalId,
  }: VerifyProfessionalAccessToMedicalRecordRequest): Promise<VerifyProfessionalAccessToMedicalRecordResponse> {
    const patient = await this.patientRepository.findById(patientId);

    if (!patient) {
      return left(new ErrorPatientNotFound());
    }

    if (patient.professionalsId !== professionalId) {
      return left(new ErrorPatientNotLinkedToProfessional(professionalId));
    }

    return right({});
  }
}
