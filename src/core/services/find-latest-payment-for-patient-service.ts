import type { Payment } from '../entities/payment';
import type { PaymentRepository } from '../repositories/payment-repository';
import { type Either, left, right } from '../utils/either';
import { ErrorLatestPaymentForProfessionalNotFound } from './errors/error-latest-payment-for-patient-not-found';

export interface FindLatestPaymentForProfessionalServiceRequest {
  professionalId: string;
}

type FindLatestPaymentForProfessionalServiceResponse = Either<
  ErrorLatestPaymentForProfessionalNotFound,
  { payment: Payment }
>;

export class FindLatestPaymentForProfessionalService {
  constructor(private paymentRepository: PaymentRepository) {}

  async handle({
    professionalId,
  }: FindLatestPaymentForProfessionalServiceRequest): Promise<FindLatestPaymentForProfessionalServiceResponse> {
    const payment =
      await this.paymentRepository.findLatestForProfessional(professionalId);

    if (!payment) {
      return left(new ErrorLatestPaymentForProfessionalNotFound());
    }

    return right({ payment });
  }
}
