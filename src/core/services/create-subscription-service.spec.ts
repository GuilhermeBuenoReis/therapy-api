import { beforeEach, describe, expect, it } from 'vitest';
import { InMemorySubscriptionRepository } from '../../../test/repositories/in-memory-subscription-repository';
import { makeSubscription } from '../../../test/factories/make-subscription';
import { SubscriptionStatus } from '../entities/subscription';
import { CreateSubscriptionService } from './create-subscription-service';
import { ErrorSubscriptionAlreadyExists } from './errors/subscription-already-exists';

let sut: CreateSubscriptionService;
let subscriptionRepository: InMemorySubscriptionRepository;

describe('Create Subscription Service', () => {
  beforeEach(() => {
    subscriptionRepository = new InMemorySubscriptionRepository();
    sut = new CreateSubscriptionService(subscriptionRepository);
  });

  it('should create a subscription when none exists', async () => {
    const startDate = new Date('2024-01-01T00:00:00');
    const endDate = new Date('2024-02-01T00:00:00');

    const result = await sut.createSubscription({
      professionalId: 'professional-01',
      monthPrice: 400,
      startDate,
      endDate,
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.subscription.status).toBe(SubscriptionStatus.Active);
    }
    expect(subscriptionRepository.items).toHaveLength(1);
  });

  it('should not create subscription if professional already has an active one', async () => {
    const existing = makeSubscription({ professionalId: 'professional-01' });
    await subscriptionRepository.create(existing);

    const result = await sut.createSubscription({
      professionalId: 'professional-01',
      monthPrice: 400,
      startDate: new Date('2024-03-01T00:00:00'),
      endDate: new Date('2024-04-01T00:00:00'),
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ErrorSubscriptionAlreadyExists);
    }
  });
});
