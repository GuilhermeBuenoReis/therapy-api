import { Subscription, SubscriptionStatus } from '@/core/entities/subscription';
import { UniqueEntityID } from '@/core/utils/unique-entity-id';
import type { subscription } from '../schemas/subscription';

type SubscriptionRow = typeof subscription.$inferSelect;
type SubscriptionInsert = typeof subscription.$inferInsert;

export class SubscriptionMapper {
  static toDomain(row: SubscriptionRow): Subscription {
    return Subscription.create(
      {
        professionalId: row.professionalId,
        monthPrice: row.monthPrice,
        status: row.status as SubscriptionStatus,
        startDate: row.startDate,
        endDate: row.endDate,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      },
      new UniqueEntityID(row.id)
    );
  }

  static toDatabase(
    subscription: Subscription
  ): SubscriptionInsert & { id: string } {
    return {
      id: subscription.id.toString(),
      professionalId: subscription.professionalId,
      monthPrice: subscription.price,
      status: subscription.status,
      startDate: subscription.startDate,
      endDate: subscription.endDate,
      createdAt: subscription.createdAt,
      updatedAt: subscription.updatedAt ?? null,
    };
  }
}
