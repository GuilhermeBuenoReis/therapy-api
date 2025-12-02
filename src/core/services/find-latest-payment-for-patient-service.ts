import type { Payment } from '../entities/payment';
import type { PaymentRepository } from '../repositories/payment-repository';
import { type Either, left, right } from '../utils/either';
import { ErrorLatestPaymentForPatientNotFound } from './errors/error-latest-payment-for-patient-not-found';

export interface FindLatestPaymentForPatientServiceRequest {
  patientId: string;
}

type FindLatestPaymentForPatientServiceResponse = Either<
  ErrorLatestPaymentForPatientNotFound,
  { payment: Payment }
>;

export class FindLatestPaymentForPatientService {
  constructor(private paymentRepository: PaymentRepository) {}

  async handle({
    patientId,
  }: FindLatestPaymentForPatientServiceRequest): Promise<FindLatestPaymentForPatientServiceResponse> {
    const payment = await this.paymentRepository.findLatestForPatient(patientId);

    if (!payment) {
      return left(new ErrorLatestPaymentForPatientNotFound());
    }

    return right({
      payment,
    });
  }
}
