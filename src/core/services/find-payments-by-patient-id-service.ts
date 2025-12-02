import type { Payment } from '../entities/payment';
import type { PaymentRepository } from '../repositories/payment-repository';
import { type Either, left, right } from '../utils/either';
import { ErrorPaymentsForPatientNotFound } from './errors/error-payments-for-patient-not-found';

export interface FindPaymentsByPatientIdServiceRequest {
  patientId: string;
}

type FindPaymentsByPatientIdServiceResponse = Either<
  ErrorPaymentsForPatientNotFound,
  { payments: Payment[] }
>;

export class FindPaymentsByPatientIdService {
  constructor(private paymentRepository: PaymentRepository) {}

  async handle({
    patientId,
  }: FindPaymentsByPatientIdServiceRequest): Promise<FindPaymentsByPatientIdServiceResponse> {
    const payments = await this.paymentRepository.findByPatientId(patientId);

    if (payments.length === 0) {
      return left(new ErrorPaymentsForPatientNotFound());
    }

    return right({
      payments,
    });
  }
}
