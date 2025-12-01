import type { Session, SessionStatus } from '../entities/session';
import type { SessionRepository } from '../repositories/session-repository';
import { type Either, left, right } from '../utils/either';
import { ErrorSessionNotFound } from './errors/session-not-found-error';

interface EditSessionServiceRequest {
  sessionId: string;
  price: number;
  notes: string;
  sessionDate: Date;
  status: SessionStatus;
  durationMinutes: number;
}

type EditSessionServiceResponse = Either<
  ErrorSessionNotFound,
  {
    session: Session;
  }
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

    session.price = price;
    session.notes = notes;
    session.sessionDate = sessionDate;
    session.status = status;
    session.durationMinutes = durationMinutes;

    await this.sessionRepository.save(session);

    return right({
      session,
    });
  }
}
