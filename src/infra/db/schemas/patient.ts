import { pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { professional } from './professional';
import { user } from './user';

export const patient = pgTable('patients', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => user.id),
  professionalId: uuid('professional_id').references(() => professional.id),
  birthDate: text('birth_date').notNull(),
  phone: text('phone').notNull(),
  note: varchar({ length: 20.0 }),

  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }),
});
