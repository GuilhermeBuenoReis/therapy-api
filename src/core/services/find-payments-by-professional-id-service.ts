import type { Payment } from '../entities/payment';
import type { PaymentRepository } from '../repositories/payment-repository';
import { type Either, left, right } from '../utils/either';
import { ErrorPaymentsForProfessionalNotFound } from './errors/error-payments-for-professional-not-found';

export interface FindPaymentsByProfessionalIdServiceRequest {
  professionalId: string;
}

type FindPaymentsByProfessionalIdServiceResponse = Either<
  ErrorPaymentsForProfessionalNotFound,
  { payments: Payment[] }
>;

export class FindPaymentsByProfessionalIdService {
  constructor(private paymentRepository: PaymentRepository) {}

  async handle({
    professionalId,
  }: FindPaymentsByProfessionalIdServiceRequest): Promise<FindPaymentsByProfessionalIdServiceResponse> {
    const payments = await this.paymentRepository.findByProfessionalId(
      professionalId
    );

    if (payments.length === 0) {
      return left(new ErrorPaymentsForProfessionalNotFound());
    }

    return right({
      payments,
    });
  }
}
