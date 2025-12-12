import {
  pgEnum,
  pgTable,
  real,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { professional } from './professional';
import { subscription } from './subscription';

export const paymentTypeEnum = pgEnum('payment_type', [
  'subscription',
  'add-on',
  'other',
]);

export const paymentMethodEnum = pgEnum('payment_method', [
  'pix',
  'cash',
  'credit',
  'debit',
]);

export const payment = pgTable('payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  professionalId: uuid('professional_id')
    .references(() => professional.id)
    .notNull(),
  subscriptionId: uuid('subscription_id').references(() => subscription.id),
  type: paymentTypeEnum('type').notNull(),
  amount: real('amount').notNull(),
  paidAt: timestamp('paid_at', { mode: 'date' }).notNull(),
  method: paymentMethodEnum('method').notNull(),
  notes: text('notes'),

  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
});
