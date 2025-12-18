import type { Subscription } from '../entities/subscription';
import { SubscriptionStatus } from '../entities/subscription';
import type { SubscriptionRepository } from '../repositories/subscription-repository';
import { type Either, left, right } from '../utils/either';
import { ErrorSubscriptionNotFound } from './errors/error-subscription-not-found';

interface CancelSubscriptionServiceRequest {
  professionalId: string;
}

type CancelSubscriptionServiceResponse = Either<
  ErrorSubscriptionNotFound,
  { subscription: Subscription }
>;

export class CancelSubscriptionService {
  constructor(private subscriptionRepository: SubscriptionRepository) {}

  async handle({
    professionalId,
  }: CancelSubscriptionServiceRequest): Promise<CancelSubscriptionServiceResponse> {
    const subscription =
      await this.subscriptionRepository.findActiveByProfessionalId(
        professionalId
      );

    if (!subscription) {
      return left(new ErrorSubscriptionNotFound());
    }

    subscription.status = SubscriptionStatus.Canceled;
    await this.subscriptionRepository.save(subscription);

    return right({
      subscription,
    });
  }
}
