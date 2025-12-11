import { pgTable, real, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { user } from './user';

export const professional = pgTable('professionals', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => user.id),
  specialty: text('specialty').notNull(),
  phone: text('phone').notNull(),
  biography: text('biography').notNull(),
  pricePerSession: real('price_per_session').notNull(),
  monthlyPrice: real('monthly_price').notNull(),
  sessionDuration: real('session_duration').notNull(),

  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }),
});
