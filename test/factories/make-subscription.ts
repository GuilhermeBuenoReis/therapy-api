import { Subscription, SubscriptionStatus } from '../../src/core/entities/subscription';
import { UniqueEntityID } from '../../src/core/utils/unique-entity-id';

type SubscriptionOverride = Partial<{
  professionalId: string;
  monthPrice: number;
  status: SubscriptionStatus;
  startDate: Date;
  endDate: Date;
  createdAt: Date;
  updatedAt: Date | null;
}>;

export function makeSubscription(
  override: SubscriptionOverride = {},
  id?: UniqueEntityID
) {
  return Subscription.create(
    {
      professionalId: override.professionalId ?? new UniqueEntityID().toString(),
      monthPrice: override.monthPrice ?? 300,
      status: override.status ?? SubscriptionStatus.Active,
      startDate:
        override.startDate ??
        new Date(Date.now() - 1000 * 60 * 60 * 24), // started yesterday
      endDate:
        override.endDate ??
        new Date(Date.now() + 1000 * 60 * 60 * 24 * 29), // valid 29 days ahead
      createdAt: override.createdAt,
      updatedAt: override.updatedAt ?? null,
    },
    id
  );
}
