import type { Subscription } from '../entities/subscription';

export interface SubscriptionRepository {
  findActiveByProfessionalId(professionalId: string): Promise<Subscription | null>;
  create(subscription: Subscription): Promise<void>;
  save(subscription: Subscription): Promise<void>;
}
