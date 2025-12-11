import { beforeEach, describe, expect, it } from 'vitest';
import { makeSubscription } from '../../../test/factories/make-subscription';
import { InMemorySubscriptionRepository } from '../../../test/repositories/in-memory-subscription-repository';
import { RenewSubscriptionService } from './renew-subscription-service';
import { ErrorSubscriptionNotFound } from './errors/error-subscription-not-found';
import { ErrorSubscriptionRenewalPeriodInvalid } from './errors/error-subscription-renewal-period-invalid';

let sut: RenewSubscriptionService;
let subscriptionRepository: InMemorySubscriptionRepository;

describe('Renew Subscription Service', () => {
  beforeEach(() => {
    subscriptionRepository = new InMemorySubscriptionRepository();
    sut = new RenewSubscriptionService(subscriptionRepository);
  });

  it('should renew subscription by extending the billing period', async () => {
    const subscription = makeSubscription({
      professionalId: 'professional-01',
      startDate: new Date('2024-01-01T00:00:00'),
      endDate: new Date('2024-02-01T00:00:00'),
      monthPrice: 400,
    });

    await subscriptionRepository.create(subscription);

    const newStart = new Date('2024-02-01T00:00:00');
    const newEnd = new Date('2024-03-01T00:00:00');

    const result = await sut.handle({
      professionalId: 'professional-01',
      newStartDate: newStart,
      newEndDate: newEnd,
      monthPrice: 450,
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.subscription.startDate).toEqual(newStart);
      expect(result.value.subscription.endDate).toEqual(newEnd);
      expect(result.value.subscription.price).toBe(450);
    }
  });

  it('should keep previous price when renewal does not include new value', async () => {
    const subscription = makeSubscription({
      professionalId: 'professional-01',
      monthPrice: 500,
      startDate: new Date('2024-01-01T00:00:00'),
      endDate: new Date('2024-02-01T00:00:00'),
    });

    await subscriptionRepository.create(subscription);

    const result = await sut.handle({
      professionalId: 'professional-01',
      newStartDate: new Date('2024-02-01T00:00:00'),
      newEndDate: new Date('2024-03-01T00:00:00'),
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.subscription.price).toBe(500);
    }
  });

  it('should not renew when new period overlaps the current cycle', async () => {
    const subscription = makeSubscription({
      professionalId: 'professional-02',
      startDate: new Date('2024-01-01T00:00:00'),
      endDate: new Date('2024-02-01T00:00:00'),
    });

    await subscriptionRepository.create(subscription);

    const result = await sut.handle({
      professionalId: 'professional-02',
      newStartDate: new Date('2024-01-15T00:00:00'),
      newEndDate: new Date('2024-02-15T00:00:00'),
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(
        ErrorSubscriptionRenewalPeriodInvalid
      );
    }
  });

  it('should not renew when end date is before start date', async () => {
    const subscription = makeSubscription({
      professionalId: 'professional-03',
    });

    await subscriptionRepository.create(subscription);

    const result = await sut.handle({
      professionalId: 'professional-03',
      newStartDate: new Date('2024-05-01T00:00:00'),
      newEndDate: new Date('2024-04-01T00:00:00'),
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(
        ErrorSubscriptionRenewalPeriodInvalid
      );
    }
  });

  it('should not renew when subscription does not exist', async () => {
    const result = await sut.handle({
      professionalId: 'missing-professional',
      newStartDate: new Date('2024-02-01T00:00:00'),
      newEndDate: new Date('2024-03-01T00:00:00'),
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ErrorSubscriptionNotFound);
    }
  });
});
