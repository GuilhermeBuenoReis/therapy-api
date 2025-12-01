import { Session, type SessionStatus } from '../entities/session';
import type { SessionRepository } from '../repositories/session-repository';
import { type Either, left, right } from '../utils/either';
import { UniqueEntityID } from '../utils/unique-entity-id';
import { ErrorSessionByPatientAlreadyExists } from './errors/session-by-patient-already-exist-error';
import { ErrorSessionByProfessionalAlreadyExists } from './errors/session-by-professional-already-exist-error';

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
    const sessionByPatient =
      await this.sessionRepository.findByPatientId(patientId);

    const sessionByProfessional =
      await this.sessionRepository.findByProfessionalId(professionalId);

    if (sessionByPatient) {
      return left(new ErrorSessionByPatientAlreadyExists());
    }

    if (sessionByProfessional) {
      return left(new ErrorSessionByProfessionalAlreadyExists());
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

    return right({
      session,
    });
  }
}
