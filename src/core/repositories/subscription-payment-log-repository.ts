import type { SubscriptionPaymentLog } from '../entities/subscription-payment-log';

export interface SubscriptionPaymentLogRepository {
  create(paymentLog: SubscriptionPaymentLog): Promise<void>;
}
