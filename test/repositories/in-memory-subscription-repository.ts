import type { Subscription } from '../../src/core/entities/subscription';
import type { SubscriptionRepository } from '../../src/core/repositories/subscription-repository';

export class InMemorySubscriptionRepository implements SubscriptionRepository {
  public items: Subscription[] = [];

  async findActiveByProfessionalId(professionalId: string): Promise<Subscription | null> {
    const subscription = this.items.find(
      item => item.professionalId === professionalId
    );

    return subscription ?? null;
  }

  async create(subscription: Subscription): Promise<void> {
    this.items.push(subscription);
  }

  async save(subscription: Subscription): Promise<void> {
    const index = this.items.findIndex(item => item.id.equals(subscription.id));

    if (index >= 0) {
      this.items[index] = subscription;
    } else {
      this.items.push(subscription);
    }
  }
}
