import { Session, SessionStatus } from '@/core/entities/session';
import { UniqueEntityID } from '@/core/utils/unique-entity-id';
import type { session } from '../schemas/session';

type SessionRow = typeof session.$inferSelect;
type SessionInsert = typeof session.$inferInsert;

export class SessionMapper {
  static toDomain(row: SessionRow): Session | null {
    if (!row.id || !row.patientId || !row.professionalId) {
      return null;
    }

    return Session.create(
      {
        patientId: row.patientId,
        professionalId: row.professionalId,
        price: row.price,
        notes: row.notes ?? '',
        sessionDate: row.sessionDate,
        status: row.status as SessionStatus,
        durationMinutes: row.durationMinutes,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      },
      new UniqueEntityID(row.id)
    );
  }

  static toDatabase(session: Session): SessionInsert & { id: string } {
    return {
      id: session.id.toString(),
      patientId: session.patientId,
      professionalId: session.professionalId,
      price: session.price,
      notes: session.notes,
      sessionDate: session.sessionDate,
      status: session.status,
      durationMinutes: session.durationMinutes,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt ?? null,
    };
  }
}
