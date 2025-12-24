import type { Session } from '@/core/entities/session';

export class SessionPresenter {
  static toHTTP(session: Session) {
    return {
      id: session.id.toString(),
      patientId: session.patientId,
      professionalId: session.professionalId,
      price: session.price,
      notes: session.notes,
      sessionDate: session.sessionDate.toISOString(),
      status: session.status,
      durationMinutes: session.durationMinutes,
      createdAt: session.createdAt.toISOString(),
      updatedAt: session.updatedAt?.toISOString() ?? null,
    };
  }
}
