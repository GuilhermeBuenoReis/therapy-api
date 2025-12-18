import type { Buffer } from 'node:buffer';

export type CheckoutSessionMode = 'subscription' | 'payment';

export interface CreateCheckoutSessionParams {
  professionalId: string;
  userId: string;
  priceId: string;
  mode: CheckoutSessionMode;
  successUrl: string;
  cancelUrl: string;
  quantity?: number;
  customerEmail?: string;
  metadata?: Record<string, string | undefined>;
}

export interface CheckoutSessionResult {
  id: string;
  url: string;
}

export interface CheckoutSessionCompletedEvent {
  type: 'checkout.session.completed';
  mode: CheckoutSessionMode;
  professionalId: string;
  userId: string;
  sessionId: string;
  subscriptionStripeId?: string;
  amountTotal?: number;
  currency?: string;
}

export interface InvoicePaymentSucceededEvent {
  type: 'invoice.payment_succeeded';
  professionalId: string;
  userId: string;
  amountPaid: number;
  currency?: string;
  periodStart?: Date;
  periodEnd?: Date;
  paidAt?: Date;
  stripeInvoiceId?: string;
}

export interface InvoicePaymentFailedEvent {
  type: 'invoice.payment_failed';
  professionalId: string;
  userId: string;
  stripeInvoiceId?: string;
}

export interface SubscriptionDeletedEvent {
  type: 'customer.subscription.deleted';
  professionalId: string;
  userId: string;
  stripeSubscriptionId?: string;
  canceledAt?: Date;
}

export type PaymentProviderEvent =
  | CheckoutSessionCompletedEvent
  | InvoicePaymentSucceededEvent
  | InvoicePaymentFailedEvent
  | SubscriptionDeletedEvent;

export interface PaymentProvider {
  createCheckoutSession(
    params: CreateCheckoutSessionParams
  ): Promise<CheckoutSessionResult>;
  verifyWebhookSignature(
    payload: Buffer,
    signature: string
  ): Promise<PaymentProviderEvent | null>;
}
