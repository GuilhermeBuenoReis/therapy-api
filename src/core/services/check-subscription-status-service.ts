import {
  type Subscription,
  SubscriptionStatus,
} from '../entities/subscription';
import type { SubscriptionRepository } from '../repositories/subscription-repository';
import type { Either } from '../utils/either';
import { left, right } from '../utils/either';
import { ErrorSubscriptionNotFound } from './errors/error-subscription-not-found';

const MILLISECONDS_IN_DAY = 1000 * 60 * 60 * 24;

export enum SubscriptionAccessLevel {
  Active = 'active',
  GraceReadOnly = 'grace-read-only',
  Blocked = 'blocked',
}

export interface CheckSubscriptionStatusServiceRequest {
  professionalId: string;
}

type CheckSubscriptionStatusServiceResponse = Either<
  ErrorSubscriptionNotFound,
  {
    subscription: Subscription;
    accessLevel: SubscriptionAccessLevel;
  }
>;

export class CheckSubscriptionStatusService {
  constructor(private subscriptionRepository: SubscriptionRepository) { }

  async handle({
    professionalId,
  }: CheckSubscriptionStatusServiceRequest): Promise<CheckSubscriptionStatusServiceResponse> {
    const subscription =
      await this.subscriptionRepository.findActiveByProfessionalId(
        professionalId
      );

    if (!subscription) {
      return left(new ErrorSubscriptionNotFound());
    }

    const accessLevel = this.resolveAccessLevel(subscription);

    return right({
      subscription,
      accessLevel,
    });
  }

  private resolveAccessLevel(
    subscription: Subscription
  ): SubscriptionAccessLevel {
    const now = Date.now();
    const start = subscription.startDate.getTime();
    const end = subscription.endDate.getTime();
    const graceLimit = end + 7 * MILLISECONDS_IN_DAY;

    const isActiveStatus = subscription.status === SubscriptionStatus.Active;

    if (!isActiveStatus || now < start) {
      return SubscriptionAccessLevel.Blocked;
    }

    if (now <= end) {
      return SubscriptionAccessLevel.Active;
    }

    if (now <= graceLimit) {
      return SubscriptionAccessLevel.GraceReadOnly;
    }

    return SubscriptionAccessLevel.Blocked;
  }
}
