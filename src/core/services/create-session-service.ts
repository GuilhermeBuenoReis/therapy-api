import { Session, type SessionStatus } from '../entities/session';
import type { PatientRepository } from '../repositories/patient-repository';
import type { SessionRepository } from '../repositories/session-repository';
import { type Either, left, right } from '../utils/either';
import { UniqueEntityID } from '../utils/unique-entity-id';
import { ErrorSessionConflict } from './errors/error-session-conflict';
import { ErrorPatientNotFound } from './errors/patient-not-found';
import { ErrorPatientNotLinkedToProfessional } from './errors/patient-not-linked-to-a-professional';
import type { ErrorSessionByPatientAlreadyExists } from './errors/session-by-patient-already-exist-error';
import type { ErrorSessionByProfessionalAlreadyExists } from './errors/session-by-professional-already-exist-error';

export interface CreateSessionServiceRequest {
  patientId: string;
  professionalId: string;
  price: number;
  notes: string;
  sessionDate: Date;
  status: SessionStatus;
  durationMinutes: number;
}

type CreateSessionServiceResponse = Either<
  | ErrorSessionConflict
  | ErrorSessionByPatientAlreadyExists
  | ErrorSessionByProfessionalAlreadyExists
  | ErrorPatientNotFound
  | ErrorPatientNotLinkedToProfessional,
  { session: Session }
>;

export class CreateSessionService {
  constructor(
    private sessionRepository: SessionRepository,
    private patientRepository: PatientRepository
  ) {}

  async handle({
    patientId,
    professionalId,
    price,
    notes,
    sessionDate,
    status,
    durationMinutes,
  }: CreateSessionServiceRequest): Promise<CreateSessionServiceResponse> {
    const patient = await this.patientRepository.findById(patientId);

    if (!patient) {
      return left(new ErrorPatientNotFound());
    }

    if (patient.professionalsId !== professionalId) {
      return left(new ErrorPatientNotLinkedToProfessional(professionalId));
    }

    const professionalTimeConflict =
      await this.sessionRepository.findByProfessionalAndDate(
        professionalId,
        sessionDate
      );

    if (professionalTimeConflict) {
      return left(new ErrorSessionConflict());
    }

    const patientTimeConflict =
      await this.sessionRepository.findByPatientAndDate(patientId, sessionDate);

    if (patientTimeConflict) {
      return left(new ErrorSessionConflict());
    }

    const session = Session.create(
      {
        patientId,
        professionalId,
        price,
        notes,
        sessionDate,
        status,
        durationMinutes,
      },
      new UniqueEntityID()
    );

    await this.sessionRepository.create(session);

    return right({ session });
  }
}
