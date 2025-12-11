import { pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { patient } from './patient';
import { professional } from './professional';
import { user } from './user';

export const payment = pgTable('payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  patient: uuid('patient_id').references(() => patient.id),
  professionalId: uuid('professional_id').references(() => professional.id),

  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }),
});
