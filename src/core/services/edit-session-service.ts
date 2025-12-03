import type { Session, SessionStatus } from '../entities/session';
import { SessionStatus as Status } from '../entities/session';
import type { SessionRepository } from '../repositories/session-repository';
import { type Either, left, right } from '../utils/either';
import { ErrorInvalidChronologicalStatus } from './errors/error-invalid-chronological-status';
import { ErrorInvalidSessionStatusTransition } from './errors/error-invalid-session-status-transition';
import { ErrorSessionNotFound } from './errors/session-not-found-error';
import { allowedTransitions } from './rules/session-status-transition-rule';

interface EditSessionServiceRequest {
  sessionId: string;
  price: number;
  notes: string;
  sessionDate: Date;
  status: SessionStatus;
  durationMinutes: number;
}

type EditSessionServiceResponse = Either<
  | ErrorSessionNotFound
  | ErrorInvalidSessionStatusTransition
  | ErrorInvalidChronologicalStatus,
  { session: Session }
>;

export class EditSessionService {
  constructor(private sessionRepository: SessionRepository) {}

  async handle({
    sessionId,
    durationMinutes,
    notes,
    price,
    sessionDate,
    status,
  }: EditSessionServiceRequest): Promise<EditSessionServiceResponse> {
    const session = await this.sessionRepository.findById(sessionId);

    if (!session) {
      return left(new ErrorSessionNotFound());
    }

    const now = new Date();
    const currentStatus = session.status;

    if (currentStatus === Status.completed && status !== Status.completed) {
      return left(
        new ErrorInvalidSessionStatusTransition(currentStatus, status)
      );
    }

    if (currentStatus !== Status.completed) {
      const allowed = allowedTransitions[currentStatus];

      if (!allowed.includes(status)) {
        return left(
          new ErrorInvalidSessionStatusTransition(currentStatus, status)
        );
      }

      if (status === Status.inProgress && sessionDate > now) {
        return left(new ErrorInvalidChronologicalStatus());
      }

      if (status === Status.completed && sessionDate > now) {
        return left(new ErrorInvalidChronologicalStatus());
      }

      if (currentStatus === Status.scheduled && session.sessionDate < now) {
        return left(new ErrorInvalidChronologicalStatus());
      }

      session.sessionDate = sessionDate;
      session.setStatus(status);
    }

    session.price = price;
    session.notes = notes;
    session.durationMinutes = durationMinutes;

    await this.sessionRepository.save(session);

    return right({ session });
  }
}
