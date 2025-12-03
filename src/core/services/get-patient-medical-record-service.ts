import type { PatientRepository } from '../repositories/patient-repository';
import { type Either, left, right } from '../utils/either';
import type { ErrorPatientNotFound } from './errors/patient-not-found';
import type { ErrorPatientNotLinkedToProfessional } from './errors/patient-not-linked-to-a-professional';
import type { VerifyProfessionalHasAccessToPatient } from './rules/verify-professional-has-access-to-patient';

interface GetPatientMedicalRecordServiceRequest {
  patientId: string;
  professionalId: string;
}

type GetPatientMedicalRecordServiceResponse = Either<
  ErrorPatientNotFound | ErrorPatientNotLinkedToProfessional,
  { notes: string }
>;

export class GetPatientMedicalRecordService {
  constructor(
    private patientRepository: PatientRepository,
    private verifier: VerifyProfessionalHasAccessToPatient
  ) {}

  async handle({
    patientId,
    professionalId,
  }: GetPatientMedicalRecordServiceRequest): Promise<GetPatientMedicalRecordServiceResponse> {
    const access = await this.verifier.execute({
      patientId,
      professionalId,
    });

    if (access.isLeft()) {
      return left(access.value);
    }

    const patient = await this.patientRepository.findById(patientId);

    const notes = patient?.note ?? '';

    return right({
      notes,
    });
  }
}
