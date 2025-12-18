import Stripe from 'stripe';
import type {
  CheckoutSessionResult,
  CreateCheckoutSessionParams,
  PaymentProvider,
  PaymentProviderEvent,
} from '@/core/services/payment-provider';
import { env } from '@/infra/env';
import { stripeClient } from './stripe-client';

export class StripePaymentProvider implements PaymentProvider {
  constructor(
    private readonly stripe: Stripe = stripeClient,
    private readonly webhookSecret: string = env.STRIPE_WEBHOOK_SECRET
  ) {}

  async createCheckoutSession(
    params: CreateCheckoutSessionParams
  ): Promise<CheckoutSessionResult> {
    const metadata = {
      professionalId: params.professionalId,
      userId: params.userId,
      mode: params.mode,
      ...(params.metadata ?? {}),
    };

    const session = await this.stripe.checkout.sessions.create({
      mode: params.mode,
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      customer_email: params.customerEmail,
      line_items: [
        {
          price: params.priceId,
          quantity: params.quantity ?? 1,
        },
      ],
      metadata,
      subscription_data:
        params.mode === 'subscription' ? { metadata } : undefined,
      payment_intent_data:
        params.mode === 'payment' ? { metadata } : undefined,
    });

    if (!session.url) {
      throw new Error('Stripe session does not contain a redirect URL.');
    }

    return {
      id: session.id,
      url: session.url,
    };
  }

  async verifyWebhookSignature(
    payload: Buffer,
    signature: string
  ): Promise<PaymentProviderEvent | null> {
    const event = this.stripe.webhooks.constructEvent(
      payload,
      signature,
      this.webhookSecret
    );

    switch (event.type) {
      case 'checkout.session.completed':
        return this.mapCheckoutSessionCompleted(
          event.data.object as Stripe.Checkout.Session
        );
      case 'invoice.payment_succeeded':
        return this.mapInvoicePaymentSucceeded(
          event.data.object as Stripe.Invoice
        );
      case 'invoice.payment_failed':
        return this.mapInvoicePaymentFailed(
          event.data.object as Stripe.Invoice
        );
      case 'customer.subscription.deleted':
        return this.mapSubscriptionDeleted(
          event.data.object as Stripe.Subscription
        );
      default:
        return null;
    }
  }

  private mapCheckoutSessionCompleted(
    session: Stripe.Checkout.Session
  ): PaymentProviderEvent {
    const metadata = this.ensureMetadata(session.metadata);

    const resolvedMode =
      metadata.mode === 'subscription' || metadata.mode === 'payment'
        ? metadata.mode
        : session.mode === 'subscription'
          ? 'subscription'
          : 'payment';

    return {
      type: 'checkout.session.completed',
      professionalId: metadata.professionalId,
      userId: metadata.userId,
      sessionId: session.id,
      mode: resolvedMode,
      subscriptionStripeId:
        typeof session.subscription === 'string'
          ? session.subscription
          : undefined,
      amountTotal: this.toCurrency(session.amount_total),
      currency: session.currency ?? undefined,
    };
  }

  private async mapInvoicePaymentSucceeded(
    invoice: Stripe.Invoice
  ): Promise<PaymentProviderEvent> {
    const metadata = await this.resolveInvoiceMetadata(invoice);

    return {
      type: 'invoice.payment_succeeded',
      professionalId: metadata.professionalId,
      userId: metadata.userId,
      amountPaid: this.toCurrency(invoice.amount_paid),
      currency: invoice.currency ?? undefined,
      periodStart: this.toDate(invoice.lines?.data?.[0]?.period?.start),
      periodEnd: this.toDate(invoice.lines?.data?.[0]?.period?.end),
      paidAt: this.toDate(invoice.status_transitions?.paid_at ?? invoice.created),
      stripeInvoiceId: invoice.id,
    };
  }

  private async mapInvoicePaymentFailed(
    invoice: Stripe.Invoice
  ): Promise<PaymentProviderEvent> {
    const metadata = await this.resolveInvoiceMetadata(invoice);

    return {
      type: 'invoice.payment_failed',
      professionalId: metadata.professionalId,
      userId: metadata.userId,
      stripeInvoiceId: invoice.id,
    };
  }

  private mapSubscriptionDeleted(
    subscription: Stripe.Subscription
  ): PaymentProviderEvent {
    const metadata = this.ensureMetadata(subscription.metadata);

    return {
      type: 'customer.subscription.deleted',
      professionalId: metadata.professionalId,
      userId: metadata.userId,
      stripeSubscriptionId: subscription.id,
      canceledAt: this.toDate(subscription.ended_at ?? subscription.canceled_at),
    };
  }

  private async resolveInvoiceMetadata(invoice: Stripe.Invoice) {
    const invoiceMetadata = invoice.metadata ?? {};

    if (invoiceMetadata.professionalId && invoiceMetadata.userId) {
      return invoiceMetadata as { professionalId: string; userId: string };
    }

    if (invoice.subscription && typeof invoice.subscription === 'string') {
      const subscription = await this.stripe.subscriptions.retrieve(
        invoice.subscription
      );
      return this.ensureMetadata(subscription.metadata);
    }

    throw new Error('Missing Stripe metadata for invoice event.');
  }

  private ensureMetadata(
    metadata: Stripe.Metadata | null | undefined
  ): { professionalId: string; userId: string; mode?: string } {
    if (
      metadata &&
      typeof metadata.professionalId === 'string' &&
      typeof metadata.userId === 'string'
    ) {
      return metadata as {
        professionalId: string;
        userId: string;
        mode?: string;
      };
    }

    throw new Error('Stripe metadata is required to process this event.');
  }

  private toCurrency(value?: number | null) {
    if (typeof value !== 'number') {
      return 0;
    }

    return value / 100;
  }

  private toDate(epoch?: number | null) {
    if (typeof epoch !== 'number') {
      return undefined;
    }

    return new Date(epoch * 1000);
  }
}
