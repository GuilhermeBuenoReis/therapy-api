import { Session, type SessionStatus } from '../entities/session';
import type { SessionRepository } from '../repositories/session-repository';
import { type Either, left, right } from '../utils/either';
import { UniqueEntityID } from '../utils/unique-entity-id';
import { ErrorSessionByPatientAlreadyExists } from './errors/session-by-patient-already-exist-error';
import { ErrorSessionByProfessionalAlreadyExists } from './errors/session-by-professional-already-exist-error';
import { ErrorSessionConflict } from './errors/error-session-conflict';

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
  | ErrorSessionByProfessionalAlreadyExists,
  { session: Session }
>;

export class CreateSessionService {
  constructor(private sessionRepository: SessionRepository) {}

  async handle({
    patientId,
    professionalId,
    price,
    notes,
    sessionDate,
    status,
    durationMinutes,
  }: CreateSessionServiceRequest): Promise<CreateSessionServiceResponse> {
    const existingPatient = await this.sessionRepository.findByPatientId(
      patientId
    );

    if (existingPatient) {
      return left(new ErrorSessionByPatientAlreadyExists());
    }

    const existingProfessional =
      await this.sessionRepository.findByProfessionalId(professionalId);

    if (existingProfessional) {
      return left(new ErrorSessionByProfessionalAlreadyExists());
    }

    const timeConflict = await this.sessionRepository.findByProfessionalAndDate(
      professionalId,
      sessionDate
    );

    if (timeConflict) {
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
