import type { Session } from '../entities/session';
import type { ProfessionalsRepository } from '../repositories/professionals-repository';
import type { SessionRepository } from '../repositories/session-repository';
import { type Either, left, right } from '../utils/either';
import { ErrorProfessionalsNotFound } from './errors/professionals-not-found';

export interface GetSessionsByProfessionalServiceRequest {
  professionalId: string;
}

type GetSessionsByProfessionalServiceResponse = Either<
  ErrorProfessionalsNotFound,
  { sessions: Session[] }
>;

export class GetSessionsByProfessionalService {
  constructor(
    private professionalsRepository: ProfessionalsRepository,
    private sessionsRepository: SessionRepository
  ) {}

  async handle({
    professionalId,
  }: GetSessionsByProfessionalServiceRequest): Promise<GetSessionsByProfessionalServiceResponse> {
    const professional =
      await this.professionalsRepository.findById(professionalId);

    if (!professional) {
      return left(new ErrorProfessionalsNotFound());
    }

    const allSessions =
      await this.sessionsRepository.findManyByProfessionalId(professionalId);

    const sessions = allSessions.filter(
      session => session.professionalId === professionalId
    );

    return right({ sessions });
  }
}
