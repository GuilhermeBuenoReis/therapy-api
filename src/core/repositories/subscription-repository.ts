import type { Subscription } from '../entities/subscription';

export interface SubscriptionRepository {
  findByUserId(userId: string): Promise<Subscription | null>;
  create(subscription: Subscription): Promise<void>;
  save(subscription: Subscription): Promise<void>;
}
