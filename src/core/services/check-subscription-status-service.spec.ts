import { beforeEach, describe, expect, it } from 'vitest';
import { makeSubscription } from '../../../test/factories/make-subscription';
import { InMemorySubscriptionRepository } from '../../../test/repositories/in-memory-subscription-repository';
import { SubscriptionStatus } from '../entities/subscription';
import {
  CheckSubscriptionStatusService,
  SubscriptionAccessLevel,
} from './check-subscription-status-service';
import { ErrorSubscriptionNotFound } from './errors/error-subscription-not-found';

let sut: CheckSubscriptionStatusService;
let subscriptionRepository: InMemorySubscriptionRepository;

describe('Check Subscription Status Service', () => {
  beforeEach(() => {
    subscriptionRepository = new InMemorySubscriptionRepository();
    sut = new CheckSubscriptionStatusService(subscriptionRepository);
  });

  it('should return not found when professional does not have subscription', async () => {
    const result = await sut.handle({
      professionalId: 'missing-professional',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ErrorSubscriptionNotFound);
    }
  });

  it('should return active access level when subscription is valid', async () => {
    const subscription = makeSubscription({
      professionalId: 'professional-01',
      startDate: new Date(Date.now() - 1000 * 60 * 60),
      endDate: new Date(Date.now() + 1000 * 60 * 60 * 24),
    });

    await subscriptionRepository.create(subscription);

    const result = await sut.handle({
      professionalId: 'professional-01',
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.accessLevel).toBe(SubscriptionAccessLevel.Active);
    }
  });

  it('should return grace read-only level when subscription expired within 7 days', async () => {
    const subscription = makeSubscription({
      professionalId: 'professional-02',
      startDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 35),
      endDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
    });

    await subscriptionRepository.create(subscription);

    const result = await sut.handle({
      professionalId: 'professional-02',
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.accessLevel).toBe(
        SubscriptionAccessLevel.GraceReadOnly
      );
    }
  });

  it('should return blocked when subscription expired for more than 7 days', async () => {
    const subscription = makeSubscription({
      professionalId: 'professional-03',
      startDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60),
      endDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10),
    });

    await subscriptionRepository.create(subscription);

    const result = await sut.handle({
      professionalId: 'professional-03',
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.accessLevel).toBe(
        SubscriptionAccessLevel.Blocked
      );
    }
  });

  it('should return blocked when subscription status is not active', async () => {
    const subscription = makeSubscription({
      professionalId: 'professional-04',
      status: SubscriptionStatus.Canceled,
      startDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10),
      endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 10),
    });

    await subscriptionRepository.create(subscription);

    const result = await sut.handle({
      professionalId: 'professional-04',
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.accessLevel).toBe(
        SubscriptionAccessLevel.Blocked
      );
    }
  });
});
