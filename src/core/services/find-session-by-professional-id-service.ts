import type { Session } from '../entities/session';
import type { SessionRepository } from '../repositories/session-repository';
import { type Either, left, right } from '../utils/either';
import { ErrorSessionNotFound } from './errors/session-not-found-error';

export interface FindSessionByProfessionalIdServiceRequest {
  professionalId: string;
}

type FindSessionByProfessionalIdServiceResponse = Either<
  ErrorSessionNotFound,
  { session: Session }
>;

export class FindSessionByProfessionalIdService {
  constructor(private sessionRepository: SessionRepository) {}

  async handle({
    professionalId,
  }: FindSessionByProfessionalIdServiceRequest): Promise<FindSessionByProfessionalIdServiceResponse> {
    const session =
      await this.sessionRepository.findByProfessionalId(professionalId);

    if (!session) {
      return left(new ErrorSessionNotFound());
    }

    return right({
      session,
    });
  }
}
