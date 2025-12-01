import type { SessionRepository } from '../repositories/session-repository';
import { type Either, left, right } from '../utils/either';
import { ErrorSessionNotFound } from './errors/session-not-found-error';

interface DeleteSessionServiceRequest {
  sessionId: string;
}

type DeleteSessionServiceResponse = Either<ErrorSessionNotFound, {}>;

export class DeleteSessionService {
  constructor(private sessionRepository: SessionRepository) {}

  async handle({
    sessionId,
  }: DeleteSessionServiceRequest): Promise<DeleteSessionServiceResponse> {
    const session = await this.sessionRepository.findById(sessionId);

    if (!session) {
      return left(new ErrorSessionNotFound());
    }

    await this.sessionRepository.delete(session);

    return right({});
  }
}
