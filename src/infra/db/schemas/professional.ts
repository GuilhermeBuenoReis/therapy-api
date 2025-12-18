import { relations } from 'drizzle-orm';
import { pgTable, real, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { patient } from './patient';
import { payment } from './payment';
import { session } from './session';
import { subscription } from './subscription';
import { user } from './user';

export const professional = pgTable('professionals', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => user.id),
  specialty: text('specialty').notNull(),
  registrationNumber: text('registration_number').notNull(),
  phone: text('phone').notNull(),
  biography: text('biography').notNull(),
  pricePerSession: real('price_per_session').notNull(),
  monthlyPrice: real('monthly_price').notNull(),
  sessionDuration: real('session_duration').notNull(),

  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }),
});

export const professionalRelations = relations(
  professional,
  ({ many, one }) => ({
    user: one(user, {
      fields: [professional.userId],
      references: [user.id],
    }),
    patients: many(patient),
    sessions: many(session),
    subscriptions: many(subscription),
    payments: many(payment),
  })
);
