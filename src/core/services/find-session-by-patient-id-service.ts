import type { Session } from '../entities/session';
import type { SessionRepository } from '../repositories/session-repository';
import { type Either, left, right } from '../utils/either';
import { ErrorSessionNotFound } from './errors/session-not-found-error';

export interface FindSessionByPatientIdServiceRequest {
  patientId: string;
}

type FindSessionByPatientIdServiceResponse = Either<
  ErrorSessionNotFound,
  { session: Session }
>;

export class FindSessionByPatientIdService {
  constructor(private sessionRepository: SessionRepository) {}

  async handle({
    patientId,
  }: FindSessionByPatientIdServiceRequest): Promise<FindSessionByPatientIdServiceResponse> {
    const session = await this.sessionRepository.findByPatientId(patientId);

    if (!session) {
      return left(new ErrorSessionNotFound());
    }

    return right({
      session,
    });
  }
}
