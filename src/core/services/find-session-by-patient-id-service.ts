import type { Session } from '../entities/session';
import type { SessionRepository } from '../repositories/session-repository';
import { type Either, left, right } from '../utils/either';
import type { ErrorPatientNotFound } from './errors/patient-not-found';
import type { ErrorPatientNotLinkedToProfessional } from './errors/patient-not-linked-to-a-professional';
import { ErrorSessionNotFound } from './errors/session-not-found-error';
import type { VerifyProfessionalHasAccessToPatient } from './rules/verify-professional-has-access-to-patient';

export interface FindSessionByPatientIdServiceRequest {
  patientId: string;
  professionalId: string;
}

type FindSessionByPatientIdServiceResponse = Either<
  | ErrorSessionNotFound
  | ErrorPatientNotFound
  | ErrorPatientNotLinkedToProfessional,
  { session: Session }
>;

export class FindSessionByPatientIdService {
  constructor(
    private sessionRepository: SessionRepository,
    private verifyAccess: VerifyProfessionalHasAccessToPatient
  ) {}

  async handle({
    patientId,
    professionalId,
  }: FindSessionByPatientIdServiceRequest): Promise<FindSessionByPatientIdServiceResponse> {
    const access = await this.verifyAccess.execute({
      patientId,
      professionalId,
    });

    if (access.isLeft()) {
      return left(access.value);
    }

    const session = await this.sessionRepository.findByPatientId(patientId);

    if (!session) {
      return left(new ErrorSessionNotFound());
    }

    return right({ session });
  }
}
