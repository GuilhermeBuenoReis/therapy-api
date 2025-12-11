import type { Payment } from '../entities/payment';
import type { PaymentRepository } from '../repositories/payment-repository';
import { type Either, left, right } from '../utils/either';
import { ErrorPaymentNotFound } from './errors/error-payment-not-found';

export interface FindSubscriptionPaymentServiceRequest {
  professionalId: string;
  subscriptionId: string;
}

type FindSubscriptionPaymentServiceResponse = Either<
  ErrorPaymentNotFound,
  { payment: Payment }
>;

export class FindSubscriptionPaymentService {
  constructor(private paymentRepository: PaymentRepository) {}

  async handle({
    professionalId,
    subscriptionId,
  }: FindSubscriptionPaymentServiceRequest): Promise<FindSubscriptionPaymentServiceResponse> {
    const payment = (
      await this.paymentRepository.findByProfessionalId(professionalId)
    ).find(item => item.subscriptionId === subscriptionId);

    if (!payment) {
      return left(new ErrorPaymentNotFound());
    }

    return right({
      payment,
    });
  }
}
