import type { Patient } from '../entities/patient';
import type { PatientRepository } from '../repositories/patient-repository';
import { type Either, left, right } from '../utils/either';
import { ErrorPatientNotFound } from './errors/patient-not-found';
import type { ErrorPatientNotLinkedToProfessional } from './errors/patient-not-linked-to-a-professional';
import type { VerifyProfessionalHasAccessToPatient } from './rules/verify-professional-has-access-to-patient';

export interface FindPatientForProfessionalServiceRequest {
  patientId: string;
  professionalId: string;
}

type FindPatientForProfessionalServiceResponse = Either<
  ErrorPatientNotFound | ErrorPatientNotLinkedToProfessional,
  { patient: Patient }
>;

export class FindPatientForProfessionalService {
  constructor(
    private patientRepository: PatientRepository,
    private verifyAccess: VerifyProfessionalHasAccessToPatient
  ) {}

  async handle({
    patientId,
    professionalId,
  }: FindPatientForProfessionalServiceRequest): Promise<FindPatientForProfessionalServiceResponse> {
    const access = await this.verifyAccess.execute({
      patientId,
      professionalId,
    });

    if (access.isLeft()) {
      return left(access.value);
    }

    const patient = await this.patientRepository.findById(patientId);

    if (!patient) {
      return left(new ErrorPatientNotFound());
    }

    return right({ patient });
  }
}
