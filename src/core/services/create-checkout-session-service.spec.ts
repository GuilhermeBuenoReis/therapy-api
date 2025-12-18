import { beforeEach, describe, expect, it } from 'vitest';
import type {
  CheckoutSessionMode,
  CheckoutSessionResult,
  CreateCheckoutSessionParams,
  PaymentProvider,
  PaymentProviderEvent,
} from './payment-provider';
import { CreateCheckoutSessionService } from './create-checkout-session-service';

class FakePaymentProvider implements PaymentProvider {
  public sessions: CreateCheckoutSessionParams[] = [];
  public shouldThrow = false;
  public sessionResult: CheckoutSessionResult = {
    id: 'cs_test_123',
    url: 'https://stripe.test/checkout/cs_test_123',
  };

  async createCheckoutSession(params: CreateCheckoutSessionParams) {
    this.sessions.push(params);

    if (this.shouldThrow) {
      throw new Error('Unable to reach Stripe');
    }

    return this.sessionResult;
  }

  async verifyWebhookSignature(): Promise<PaymentProviderEvent | null> {
    return null;
  }
}

describe('Create Checkout Session Service', () => {
  let paymentProvider: FakePaymentProvider;
  let sut: CreateCheckoutSessionService;

  beforeEach(() => {
    paymentProvider = new FakePaymentProvider();
    sut = new CreateCheckoutSessionService(paymentProvider);
  });

  it('should create a checkout session with the provided params', async () => {
    const result = await sut.execute({
      professionalId: 'professional-01',
      userId: 'user-01',
      priceId: 'price_123',
      mode: 'subscription',
      successUrl: 'https://app.test/success',
      cancelUrl: 'https://app.test/cancel',
      quantity: 1,
      customerEmail: 'john@example.com',
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.sessionId).toBe('cs_test_123');
      expect(result.value.url).toBe(
        'https://stripe.test/checkout/cs_test_123'
      );
    }

    expect(paymentProvider.sessions).toHaveLength(1);
    expect(paymentProvider.sessions[0]).toMatchObject({
      professionalId: 'professional-01',
      userId: 'user-01',
      priceId: 'price_123',
      mode: 'subscription' satisfies CheckoutSessionMode,
      successUrl: 'https://app.test/success',
      cancelUrl: 'https://app.test/cancel',
      quantity: 1,
      customerEmail: 'john@example.com',
      metadata: {
        professionalId: 'professional-01',
        userId: 'user-01',
        mode: 'subscription',
      },
    });
  });

  it('should return an error when the payment provider fails', async () => {
    paymentProvider.shouldThrow = true;

    const result = await sut.execute({
      professionalId: 'professional-01',
      userId: 'user-01',
      priceId: 'price_123',
      mode: 'subscription',
      successUrl: 'https://app.test/success',
      cancelUrl: 'https://app.test/cancel',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(Error);
      expect(result.value.message).toBe('Unable to reach Stripe');
    }
  });
});
