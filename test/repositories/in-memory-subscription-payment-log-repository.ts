import type { SubscriptionPaymentLog } from '../../src/core/entities/subscription-payment-log';
import type { SubscriptionPaymentLogRepository } from '../../src/core/repositories/subscription-payment-log-repository';

export class InMemorySubscriptionPaymentLogRepository
  implements SubscriptionPaymentLogRepository
{
  public items: SubscriptionPaymentLog[] = [];

  async create(paymentLog: SubscriptionPaymentLog): Promise<void> {
    this.items.push(paymentLog);
  }
}
