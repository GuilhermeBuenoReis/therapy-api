import type { Payment } from '../entities/payment';
import type { PaymentRepository } from '../repositories/payment-repository';
import { type Either, left, right } from '../utils/either';
import { ErrorPaymentNotFound } from './errors/error-payment-not-found';

export interface FindSessionPaymentServiceRequest {
  sessionId: string;
}

type FindSessionPaymentServiceResponse = Either<
  ErrorPaymentNotFound,
  { payment: Payment }
>;

export class FindSessionPaymentService {
  constructor(private paymentRepository: PaymentRepository) {}

  async handle({
    sessionId,
  }: FindSessionPaymentServiceRequest): Promise<FindSessionPaymentServiceResponse> {
    const payment = await this.paymentRepository.findSessionPayment(sessionId);

    if (!payment) {
      return left(new ErrorPaymentNotFound());
    }

    return right({
      payment,
    });
  }
}
