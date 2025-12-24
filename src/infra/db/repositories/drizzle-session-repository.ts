import { and, desc, eq, gte, lt } from 'drizzle-orm';
import type { Session } from '@/core/entities/session';
import type { SessionRepository } from '@/core/repositories/session-repository';
import { db } from '..';
import { SessionMapper } from '../mappers/session-mapper';
import { session as sessionSchema } from '../schemas/session';

export class DrizzleSessionRepository implements SessionRepository {
  async findByPatientId(patientId: string): Promise<Session | null> {
    const sessionRow = await db.query.session.findFirst({
      where: eq(sessionSchema.patientId, patientId),
      orderBy: [desc(sessionSchema.sessionDate)],
    });

    if (!sessionRow) {
      return null;
    }

    return SessionMapper.toDomain(sessionRow);
  }

  async findByProfessionalId(professionalId: string): Promise<Session | null> {
    const sessionRow = await db.query.session.findFirst({
      where: eq(sessionSchema.professionalId, professionalId),
      orderBy: [desc(sessionSchema.sessionDate)],
    });

    if (!sessionRow) {
      return null;
    }

    return SessionMapper.toDomain(sessionRow);
  }

  async findByProfessionalAndDate(
    professionalId: string,
    sessionDate: Date
  ): Promise<Session | null> {
    const sessionRow = await db.query.session.findFirst({
      where: and(
        eq(sessionSchema.professionalId, professionalId),
        eq(sessionSchema.sessionDate, sessionDate)
      ),
    });

    if (!sessionRow) {
      return null;
    }

    return SessionMapper.toDomain(sessionRow);
  }

  async findByPatientAndDate(
    patientId: string,
    sessionDate: Date
  ): Promise<Session | null> {
    const sessionRow = await db.query.session.findFirst({
      where: and(
        eq(sessionSchema.patientId, patientId),
        eq(sessionSchema.sessionDate, sessionDate)
      ),
    });

    if (!sessionRow) {
      return null;
    }

    return SessionMapper.toDomain(sessionRow);
  }

  async findManyByProfessionalAndMonth(
    professionalId: string,
    month: number,
    year: number
  ): Promise<Session[]> {
    const startOfMonth = new Date(Date.UTC(year, month - 1, 1));
    const startOfNextMonth = new Date(Date.UTC(year, month, 1));

    const rows = await db.query.session.findMany({
      where: and(
        eq(sessionSchema.professionalId, professionalId),
        gte(sessionSchema.sessionDate, startOfMonth),
        lt(sessionSchema.sessionDate, startOfNextMonth)
      ),
      orderBy: [desc(sessionSchema.sessionDate)],
    });

    return rows
      .map((row) => SessionMapper.toDomain(row))
      .filter((session): session is Session => session !== null);
  }

  async findManyByProfessionalId(professionalId: string): Promise<Session[]> {
    const rows = await db.query.session.findMany({
      where: eq(sessionSchema.professionalId, professionalId),
      orderBy: [desc(sessionSchema.sessionDate)],
    });

    return rows
      .map((row) => SessionMapper.toDomain(row))
      .filter((session): session is Session => session !== null);
  }

  async findById(id: string): Promise<Session | null> {
    const sessionRow = await db.query.session.findFirst({
      where: eq(sessionSchema.id, id),
    });

    if (!sessionRow) {
      return null;
    }

    return SessionMapper.toDomain(sessionRow);
  }

  async create(session: Session): Promise<void> {
    const data = SessionMapper.toDatabase(session);
    await db.insert(sessionSchema).values(data);
  }

  async save(session: Session): Promise<void> {
    const data = SessionMapper.toDatabase(session);

    await db
      .update(sessionSchema)
      .set({
        patientId: data.patientId,
        professionalId: data.professionalId,
        price: data.price,
        notes: data.notes,
        sessionDate: data.sessionDate,
        status: data.status,
        durationMinutes: data.durationMinutes,
        updatedAt: data.updatedAt ?? new Date(),
      })
      .where(eq(sessionSchema.id, data.id));
  }

  async delete(session: Session): Promise<void> {
    await db
      .delete(sessionSchema)
      .where(eq(sessionSchema.id, session.id.toString()));
  }
}
