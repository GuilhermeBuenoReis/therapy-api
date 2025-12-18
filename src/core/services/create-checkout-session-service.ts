import type {
  CheckoutSessionMode,
  PaymentProvider,
} from './payment-provider';
import { left, right, type Either } from '../utils/either';

export interface CreateCheckoutSessionServiceRequest {
  professionalId: string;
  userId: string;
  priceId: string;
  mode: CheckoutSessionMode;
  successUrl: string;
  cancelUrl: string;
  quantity?: number;
  customerEmail?: string;
}

type CreateCheckoutSessionServiceResponse = Either<
  Error,
  {
    sessionId: string;
    url: string;
  }
>;

export class CreateCheckoutSessionService {
  constructor(private paymentProvider: PaymentProvider) {}

  async execute({
    professionalId,
    userId,
    priceId,
    mode,
    successUrl,
    cancelUrl,
    quantity,
    customerEmail,
  }: CreateCheckoutSessionServiceRequest): Promise<CreateCheckoutSessionServiceResponse> {
    try {
      const session = await this.paymentProvider.createCheckoutSession({
        professionalId,
        userId,
        priceId,
        mode,
        successUrl,
        cancelUrl,
        quantity,
        customerEmail,
        metadata: {
          professionalId,
          userId,
          mode,
        },
      });

      return right({
        sessionId: session.id,
        url: session.url,
      });
    } catch (error) {
      if (error instanceof Error) {
        return left(error);
      }

      return left(new Error('Unable to create checkout session'));
    }
  }
}
