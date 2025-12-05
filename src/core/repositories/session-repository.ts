import type { Session } from '../entities/session';

export interface SessionRepository {
  findByPatientId(patientId: string): Promise<Session | null>;
  findByProfessionalId(professionalId: string): Promise<Session | null>;
  findByProfessionalAndDate(
    professionalId: string,
    sessionDate: Date
  ): Promise<Session | null>;
  findByPatientAndDate(
    patientId: string,
    sessionDate: Date
  ): Promise<Session | null>;
  findManyByProfessionalAndMonth(
    professionalId: string,
    month: number,
    year: number
  ): Promise<Session[]>;
  findManyByProfessionalId(professionalId: string): Promise<Session[]>;
  findById(id: string): Promise<Session | null>;
  create(session: Session): Promise<void>;
  save(session: Session): Promise<void>;
  delete(session: Session): Promise<void>;
}
