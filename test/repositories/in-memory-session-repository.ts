import type { Session } from '../../src/core/entities/session';
import type { SessionRepository } from '../../src/core/repositories/session-repository';

export class InMemorySessionRepository implements SessionRepository {
  public items: Session[] = [];

  async findByPatientId(patientId: string): Promise<Session | null> {
    const session = this.items.find(item => item.patientId === patientId);

    if (!session) {
      return null;
    }
    return session;
  }

  async findByProfessionalId(professionalId: string): Promise<Session | null> {
    const session = this.items.find(
      item => item.professionalId === professionalId
    );

    if (!session) {
      return null;
    }
    return session;
  }

  async findByProfessionalAndDate(
    professionalId: string,
    sessionDate: Date
  ): Promise<Session | null> {
    const session = this.items.find(
      item =>
        item.professionalId === professionalId &&
        item.sessionDate.getTime() === sessionDate.getTime()
    );

    if (!session) {
      return null;
    }
    return session;
  }

  async findByPatientAndDate(
    patientId: string,
    sessionDate: Date
  ): Promise<Session | null> {
    const session = this.items.find(
      item =>
        item.patientId === patientId &&
        item.sessionDate.getTime() === sessionDate.getTime()
    );

    if (!session) {
      return null;
    }
    return session;
  }

  async findManyByProfessionalId(professionalId: string): Promise<Session[]> {
    return this.items.filter(item => item.professionalId === professionalId);
  }

  async findManyByProfessionalAndMonth(
    professionalId: string,
    month: number,
    year: number
  ): Promise<Session[]> {
    return this.items.filter(
      session =>
        session.professionalId === professionalId &&
        session.sessionDate.getUTCMonth() + 1 === month &&
        session.sessionDate.getUTCFullYear() === year
    );
  }

  async findById(id: string): Promise<Session | null> {
    const session = this.items.find(item => item.id.toString() === id);

    if (!session) {
      return null;
    }
    return session;
  }

  async create(session: Session): Promise<void> {
    this.items.push(session);
  }

  async save(session: Session): Promise<void> {
    const itemIndex = this.items.findIndex(item => item.id === session.id);

    this.items[itemIndex] = session;
  }

  async delete(session: Session): Promise<void> {
    const itemIndex = this.items.findIndex(
      item => item.id.toString() === session.id.toString()
    );

    this.items.splice(itemIndex, 1);
  }
}
