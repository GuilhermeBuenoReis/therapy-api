import { relations } from 'drizzle-orm';
import {
  pgEnum,
  pgTable,
  primaryKey,
  real,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { patient } from './patient';
import { professional } from './professional';

export const statusEnum = pgEnum('status_enum', [
  'scheduled',
  'completed',
  'canceled',
]);

export const session = pgTable(
  'sessions',
  {
    id: uuid('id').defaultRandom().notNull(),
    patientId: uuid('patient_id').notNull().references(() => patient.id),
    professionalId: uuid('professional_id')
      .notNull()
      .references(() => professional.id),
    price: real('price').notNull(),
    notes: varchar({ length: 20000 }),
    sessionDate: timestamp('session_date', { mode: 'date' }).notNull(),
    status: statusEnum('status').default('scheduled').notNull(),
    durationMinutes: real('duration_minutes').notNull(),

    createdAt: timestamp('created_at', { mode: 'date' })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'date' }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.id], name: 'sessions_pk' }),
  })
);

export const sessionRelations = relations(session, ({ one }) => ({
  patient: one(patient, {
    fields: [session.patientId],
    references: [patient.id],
  }),
  professional: one(professional, {
    fields: [session.professionalId],
    references: [professional.id],
  }),
}));
