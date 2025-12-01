import type { Session } from '../entities/session';
import type { SessionRepository } from '../repositories/session-repository';
import { type Either, left, right } from '../utils/either';
import { ErrorSessionNotFound } from './errors/session-not-found-error';

export interface FindSessionByIdServiceRequest {
  sessionId: string;
}

type FindSessionByIdServiceResponse = Either<
  ErrorSessionNotFound,
  { session: Session }
>;

export class FindSessionByIdService {
  constructor(private sessionRepository: SessionRepository) {}

  async handle({
    sessionId,
  }: FindSessionByIdServiceRequest): Promise<FindSessionByIdServiceResponse> {
    const session = await this.sessionRepository.findById(sessionId);

    if (!session) {
      return left(new ErrorSessionNotFound());
    }

    return right({
      session,
    });
  }
}
