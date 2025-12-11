import {
  pgEnum,
  pgTable,
  real,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { patient } from './patient';
import { professional } from './professional';

const statusEnum = pgEnum('status_enum', [
  'scheduled',
  'in-progress',
  'completed',
  'canceled'
]);

export const session = pgTable('sessions', {
  patientId: uuid('patient_id').references(() => patient.id),
  professionalId: uuid('professional_id').references(() => professional.id),
  price: real('price').notNull(),
  notes: varchar({ length: 20.0 }),
  sessionDate: timestamp('session_date', { mode: 'date' }).notNull(),
  status: statusEnum('status').notNull().default('scheduled'),
  durationMinutes: real('duration_minutes').notNull(),

  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }),
});
