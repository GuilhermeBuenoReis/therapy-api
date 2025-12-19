import type { Subscription } from '@/core/entities/subscription';

export class SubscriptionPresenter {
  static toHTTP(subscription: Subscription) {
    return {
      id: subscription.id.toString(),
      professionalId: subscription.professionalId,
      monthPrice: subscription.price,
      status: subscription.status,
      startDate: subscription.startDate.toISOString(),
      endDate: subscription.endDate.toISOString(),
      createdAt: subscription.createdAt.toISOString(),
      updatedAt: subscription.updatedAt?.toISOString() ?? null,
    };
  }
}
