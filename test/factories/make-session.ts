import { faker } from '@faker-js/faker';
import { Session, SessionStatus } from '../../src/core/entities/session';
import { UniqueEntityID } from '../../src/core/utils/unique-entity-id';

type SessionOverride = Partial<{
  patientId: string;
  professionalId: string;
  price: number;
  notes: string;
  sessionDate: Date;
  status: SessionStatus;
  durationMinutes: number;
}>;

export function makeSession(
  override: SessionOverride = {},
  id?: UniqueEntityID
) {
  const session = Session.create(
    {
      patientId: override.patientId ?? new UniqueEntityID().toString(),
      professionalId:
        override.professionalId ?? new UniqueEntityID().toString(),
      price: override.price ?? faker.number.int({ min: 120, max: 300 }),
      notes:
        override.notes ??
        faker.helpers.arrayElement(['Follow-up', 'First session', 'Assessment']),
      sessionDate: override.sessionDate ?? faker.date.recent(),
      status: override.status ?? SessionStatus.scheduled,
      durationMinutes: override.durationMinutes ?? faker.number.int({ min: 30, max: 90 }),
    },
    id
  );

  return session;
}
