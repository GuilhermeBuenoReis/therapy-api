import type { Subscription } from '../entities/subscription';
import type { SubscriptionRepository } from '../repositories/subscription-repository';
import type { Either } from '../utils/either';
import { left, right } from '../utils/either';
import { ErrorSubscriptionNotFound } from './errors/error-subscription-not-found';
import { ErrorSubscriptionRenewalPeriodInvalid } from './errors/error-subscription-renewal-period-invalid';

export interface RenewSubscriptionServiceRequest {
  professionalId: string;
  newStartDate: Date;
  newEndDate: Date;
  monthPrice?: number;
}

type RenewSubscriptionServiceResponse = Either<
  ErrorSubscriptionNotFound | ErrorSubscriptionRenewalPeriodInvalid,
  { subscription: Subscription }
>;

export class RenewSubscriptionService {
  constructor(private subscriptionRepository: SubscriptionRepository) { }

  async handle({
    professionalId,
    newStartDate,
    newEndDate,
    monthPrice,
  }: RenewSubscriptionServiceRequest): Promise<RenewSubscriptionServiceResponse> {
    const subscription =
      await this.subscriptionRepository.findActiveByProfessionalId(
        professionalId
      );

    if (!subscription) {
      return left(new ErrorSubscriptionNotFound());
    }

    if (newEndDate.getTime() <= newStartDate.getTime()) {
      return left(new ErrorSubscriptionRenewalPeriodInvalid());
    }

    if (newStartDate.getTime() < subscription.endDate.getTime()) {
      return left(new ErrorSubscriptionRenewalPeriodInvalid());
    }

    subscription.renew({
      startDate: newStartDate,
      endDate: newEndDate,
      monthPrice,
    });

    await this.subscriptionRepository.save(subscription);

    return right({
      subscription,
    });
  }
}
