import Stripe from 'stripe';
import { env } from '@/infra/env';

export const stripeClient = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
});
