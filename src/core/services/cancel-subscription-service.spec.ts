import { beforeEach, describe, expect, it } from 'vitest';
import { InMemorySubscriptionRepository } from '../../../test/repositories/in-memory-subscription-repository';
import { Subscription, SubscriptionStatus } from '../entities/subscription';
import { UniqueEntityID } from '../utils/unique-entity-id';
import { CancelSubscriptionService } from './cancel-subscription-service';
import { ErrorSubscriptionNotFound } from './errors/error-subscription-not-found';

let sut: CancelSubscriptionService;
let subscriptionRepository: InMemorySubscriptionRepository;

describe('Cancel Subscription Service', () => {
  beforeEach(() => {
    subscriptionRepository = new InMemorySubscriptionRepository();
    sut = new CancelSubscriptionService(subscriptionRepository);
  });

  it('should cancel an active subscription', async () => {
    const subscription = Subscription.create(
      {
        professionalId: 'professional-01',
        monthPrice: 2000,
        status: SubscriptionStatus.Active,
        startDate: new Date('2024-01-01T00:00:00Z'),
        endDate: new Date('2024-02-01T00:00:00Z'),
      },
      new UniqueEntityID('sub-01')
    );

    await subscriptionRepository.create(subscription);

    const result = await sut.handle({ professionalId: 'professional-01' });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.subscription.status).toBe(
        SubscriptionStatus.Canceled
      );
    }
    expect(subscriptionRepository.items[0].status).toBe(
      SubscriptionStatus.Canceled
    );
  });

  it('should return an error when no active subscription exists', async () => {
    const result = await sut.handle({ professionalId: 'missing-professional' });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ErrorSubscriptionNotFound);
    }
  });
});
