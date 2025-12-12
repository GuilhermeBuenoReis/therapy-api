import {
  pgEnum,
  pgTable,
  real,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { professional } from './professional';

export const subscriptionStatusEnum = pgEnum('subscription_status', [
  'active',
  'expired',
  'canceled',
  'pending',
]);

export const subscription = pgTable('subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  professionalId: uuid('professional_id')
    .references(() => professional.id)
    .notNull(),
  monthPrice: real('month_price').notNull(),
  status: subscriptionStatusEnum('status').notNull().default('pending'),
  startDate: timestamp('start_date', { mode: 'date' }).notNull(),
  endDate: timestamp('end_date', { mode: 'date' }).notNull(),

  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }),
});
