import { MethodEnum, TypeEnum } from '../entities/payment';
import type { CancelSubscriptionService } from './cancel-subscription-service';
import type { ConfirmUserPaymentService } from './confirm-user-payment-service';
import type { CreatePaymentService } from './create-payment-service';
import type { CreateSubscriptionService } from './create-subscription-service';
import { ErrorSubscriptionAlreadyExists } from './errors/subscription-already-exists';
import type {
  InvoicePaymentSucceededEvent,
  PaymentProviderEvent,
} from './payment-provider';
import type { RenewSubscriptionService } from './renew-subscription-service';

interface HandleStripeWebhookServiceRequest {
  event: PaymentProviderEvent;
}

export class HandleStripeWebhookService {
  constructor(
    private readonly confirmUserPaymentService: ConfirmUserPaymentService,
    private readonly createSubscriptionService: CreateSubscriptionService,
    private readonly renewSubscriptionService: RenewSubscriptionService,
    private readonly cancelSubscriptionService: CancelSubscriptionService,
    private readonly createPaymentService: CreatePaymentService
  ) {}

  async handle({ event }: HandleStripeWebhookServiceRequest): Promise<void> {
    if (event.type === 'checkout.session.completed') {
      await this.handleCheckoutSessionCompleted(event);
      return;
    }

    if (event.type === 'invoice.payment_succeeded') {
      await this.handleInvoicePaymentSucceeded(event);
      return;
    }

    if (event.type === 'invoice.payment_failed') {
      return;
    }

    if (event.type === 'customer.subscription.deleted') {
      await this.cancelSubscriptionService.handle({
        professionalId: event.professionalId,
      });
    }
  }

  private async handleCheckoutSessionCompleted(event: {
    type: 'checkout.session.completed';
    userId: string;
  }) {
    await this.confirmUserPaymentService.execute({
      userId: event.userId,
      confirmedAt: new Date(),
    });
  }

  private async handleInvoicePaymentSucceeded(
    event: InvoicePaymentSucceededEvent
  ) {
    const monthPrice = event.amountPaid;
    const startDate = event.periodStart ?? new Date();
    const endDate =
      event.periodEnd ??
      new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000);

    const subscriptionId = await this.ensureActiveSubscription({
      professionalId: event.professionalId,
      monthPrice,
      startDate,
      endDate,
    });

    await this.createPaymentService.handle({
      professionalId: event.professionalId,
      subscriptionId,
      type: TypeEnum.Subscription,
      amount: monthPrice,
      paidAt: event.paidAt ?? new Date(),
      method: MethodEnum.Credit,
      notes: event.stripeInvoiceId
        ? `Stripe invoice ${event.stripeInvoiceId}`
        : null,
    });
  }

  private async ensureActiveSubscription({
    professionalId,
    monthPrice,
    startDate,
    endDate,
  }: {
    professionalId: string;
    monthPrice: number;
    startDate: Date;
    endDate: Date;
  }): Promise<string | undefined> {
    const creationResult =
      await this.createSubscriptionService.createSubscription({
        professionalId,
        monthPrice,
        startDate,
        endDate,
      });

    if (creationResult.isRight()) {
      return creationResult.value.subscription.id.toString();
    }

    if (creationResult.value instanceof ErrorSubscriptionAlreadyExists) {
      const renewalResult = await this.renewSubscriptionService.handle({
        professionalId,
        newStartDate: startDate,
        newEndDate: endDate,
        monthPrice,
      });

      if (renewalResult.isRight()) {
        return renewalResult.value.subscription.id.toString();
      }
    }

    return undefined;
  }
}
