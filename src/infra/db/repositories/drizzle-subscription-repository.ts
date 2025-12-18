import { desc, eq } from 'drizzle-orm';
import type { Subscription } from '@/core/entities/subscription';
import type { SubscriptionRepository } from '@/core/repositories/subscription-repository';
import { db } from '..';
import { SubscriptionMapper } from '../mappers/subscription-mapper';
import { subscription as subscriptionSchema } from '../schemas/subscription';

export class DrizzleSubscriptionRepository
  implements SubscriptionRepository
{
  async findActiveByProfessionalId(
    professionalId: string
  ): Promise<Subscription | null> {
    const [row] = await db
      .select()
      .from(subscriptionSchema)
      .where(eq(subscriptionSchema.professionalId, professionalId))
      .orderBy(desc(subscriptionSchema.endDate))
      .limit(1);

    if (!row) {
      return null;
    }

    return SubscriptionMapper.toDomain(row);
  }

  async create(subscription: Subscription): Promise<void> {
    const data = SubscriptionMapper.toDatabase(subscription);

    await db.insert(subscriptionSchema).values(data);
  }

  async save(subscription: Subscription): Promise<void> {
    const data = SubscriptionMapper.toDatabase(subscription);

    await db
      .update(subscriptionSchema)
      .set({
        monthPrice: data.monthPrice,
        status: data.status,
        startDate: data.startDate,
        endDate: data.endDate,
        updatedAt: data.updatedAt ?? new Date(),
      })
      .where(eq(subscriptionSchema.id, data.id));
  }
}
