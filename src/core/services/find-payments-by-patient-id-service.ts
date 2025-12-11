import type { Payment } from '../entities/payment';
import type { PaymentRepository } from '../repositories/payment-repository';
import { type Either, left, right } from '../utils/either';
import { ErrorSubscriptionPaymentsNotFound } from './errors/error-payments-for-patient-not-found';

export interface FindSubscriptionPaymentsByProfessionalServiceRequest {
  professionalId: string;
  subscriptionId?: string | null;
}

type FindSubscriptionPaymentsByProfessionalServiceResponse = Either<
  ErrorSubscriptionPaymentsNotFound,
  { payments: Payment[] }
>;

export class FindSubscriptionPaymentsByProfessionalService {
  constructor(private paymentRepository: PaymentRepository) {}

  async handle({
    professionalId,
    subscriptionId,
  }: FindSubscriptionPaymentsByProfessionalServiceRequest): Promise<FindSubscriptionPaymentsByProfessionalServiceResponse> {
    const payments = await this.paymentRepository.findByProfessionalId(
      professionalId
    );

    const filteredPayments =
      subscriptionId !== undefined && subscriptionId !== null
        ? payments.filter(payment => payment.subscriptionId === subscriptionId)
        : payments;

    if (filteredPayments.length === 0) {
      return left(new ErrorSubscriptionPaymentsNotFound());
    }

    return right({ payments: filteredPayments });
  }
}
