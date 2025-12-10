import { Subscription, SubscriptionStatus } from '../entities/subscription'
import type { SubscriptionRepository } from '../repositories/subscription-repository'
import type { Either } from '../utils/either'
import { left, right } from '../utils/either'
import { UniqueEntityID } from '../utils/unique-entity-id'
import { ErrorSubscriptionAlreadyExists } from './errors/subscription-already-exists'

export interface CreateSubscriptionServiceRequest {
  professionalId: string
  monthPrice: number
  startDate: Date
  endDate: Date
}

type CreateSubscriptionServiceResponse = Either<
  ErrorSubscriptionAlreadyExists,
  { subscription: Subscription }
>

export class CreateSubscriptionService {
  constructor(private subscriptionRepository: SubscriptionRepository) { }

  async createSubscription(
    { professionalId, monthPrice, startDate, endDate }: CreateSubscriptionServiceRequest
  ): Promise<CreateSubscriptionServiceResponse> {


    const existingActiveSubscription = await this.subscriptionRepository.findActiveByProfessionalId(
      professionalId
    )

    if (existingActiveSubscription) {
      return left(new ErrorSubscriptionAlreadyExists())
    }

    const subscription = Subscription.create(
      {
        professionalId,
        monthPrice,
        startDate,
        endDate,
        status: SubscriptionStatus.Active
      },
      new UniqueEntityID()
    )

    await this.subscriptionRepository.create(subscription)

    return right({
      subscription
    })
  }
}
