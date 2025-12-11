import { SubscriptionPaymentLog } from '../entities/subscription-payment-log';
import type { SubscriptionPaymentLogRepository } from '../repositories/subscription-payment-log-repository';
import type { SubscriptionRepository } from '../repositories/subscription-repository';
import type { Either } from '../utils/either';
import { left, right } from '../utils/either';
import { ErrorSubscriptionNotFound } from './errors/error-subscription-not-found';

export interface RegisterSubscriptionPaymentServiceRequest {
  professionalId: string;
  amount: number;
  paidAt: Date;
  notes?: string | null;
}

type RegisterSubscriptionPaymentServiceResponse = Either<
  ErrorSubscriptionNotFound,
  { paymentLog: SubscriptionPaymentLog }
>;

export class RegisterSubscriptionPaymentService {
  constructor(
    private subscriptionRepository: SubscriptionRepository,
    private subscriptionPaymentLogRepository: SubscriptionPaymentLogRepository
  ) { }

  async handle({
    professionalId,
    amount,
    paidAt,
    notes,
  }: RegisterSubscriptionPaymentServiceRequest): Promise<RegisterSubscriptionPaymentServiceResponse> {
    const subscription =
      await this.subscriptionRepository.findActiveByProfessionalId(
        professionalId
      );

    if (!subscription) {
      return left(new ErrorSubscriptionNotFound());
    }

    const paymentLog = SubscriptionPaymentLog.create({
      subscriptionId: subscription.id.toString(),
      professionalId,
      amount,
      paidAt,
      notes,
    });

    await this.subscriptionPaymentLogRepository.create(paymentLog);

    return right({
      paymentLog,
    });
  }
}
