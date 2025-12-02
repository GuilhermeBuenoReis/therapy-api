import type { Payment } from '../entities/payment';
import type { PaymentRepository } from '../repositories/payment-repository';
import { type Either, left, right } from '../utils/either';
import { ErrorPaymentNotFound } from './errors/error-payment-not-found';

export interface FindPaymentByIdServiceRequest {
  paymentId: string;
}

type FindPaymentByIdServiceResponse = Either<
  ErrorPaymentNotFound,
  { payment: Payment }
>;

export class FindPaymentByIdService {
  constructor(private paymentRepository: PaymentRepository) {}

  async handle({
    paymentId,
  }: FindPaymentByIdServiceRequest): Promise<FindPaymentByIdServiceResponse> {
    const payment = await this.paymentRepository.findById(paymentId);

    if (!payment) {
      return left(new ErrorPaymentNotFound());
    }

    return right({
      payment,
    });
  }
}
