import type { Session } from '../entities/session';

export interface SessionRepository {
  findByPatientId(patientId: string): Promise<Session | null>;
  findByProfessionalId(professionalId: string): Promise<Session | null>;
  findByProfessionalAndDate(
    professionalId: string,
    sessionDate: Date
  ): Promise<Session | null>;
  findById(id: string): Promise<Session | null>;
  create(session: Session): Promise<void>;
  save(session: Session): Promise<void>;
  delete(session: Session): Promise<void>;
}
