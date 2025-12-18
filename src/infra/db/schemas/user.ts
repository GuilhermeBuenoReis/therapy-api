import { relations } from 'drizzle-orm';
import {
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { patient } from './patient';
import { professional } from './professional';

export const userRoleEnum = pgEnum('user_role', ['professional', 'patient']);

export const user = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    email: text('email').notNull().unique(),
    password: text('password').notNull(),
    role: userRoleEnum('role').notNull().default('professional'),
    paymentConfirmedAt: timestamp('payment_confirmed_at', { mode: 'date' }),

    createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'date' }),
  },
);

export const userRelations = relations(user, ({ one }) => ({
  patient: one(patient, {
    fields: [user.id],
    references: [patient.userId],
  }),
  professional: one(professional, {
    fields: [user.id],
    references: [professional.userId],
  }),
}));
