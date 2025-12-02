import { type MethodEnum, Payment, type TypeEnum } from '../entities/payment';
import type { PaymentRepository } from '../repositories/payment-repository';
import { type Either, left, right } from '../utils/either';
import { UniqueEntityID } from '../utils/unique-entity-id';
import { ErrorPaymentSessionAlreadyExists } from './errors/error-payment-session-already-exists';

export interface CreatePaymentServiceRequest {
  professionalId: string;
  patientId: string;
  sessionId: string;
  type: TypeEnum;
  amount: number;
  paidAt: Date;
  method: MethodEnum;
  notes?: string | null;
}

type CreatePaymentServiceResponse = Either<
  ErrorPaymentSessionAlreadyExists,
  { payment: Payment }
>;

export class CreatePaymentService {
  constructor(private paymentRepository: PaymentRepository) {}

  async handle({
    professionalId,
    patientId,
    sessionId,
    type,
    amount,
    paidAt,
    method,
    notes,
  }: CreatePaymentServiceRequest): Promise<CreatePaymentServiceResponse> {
    const existingSessionPayment =
      await this.paymentRepository.findSessionPayment(sessionId);

    if (existingSessionPayment) {
      return left(new ErrorPaymentSessionAlreadyExists());
    }

    const payment = Payment.create(
      {
        professionalId,
        patientId,
        sessionId,
        type,
        amount,
        paidAt,
        method,
        notes: notes ?? null,
      },
      new UniqueEntityID()
    );

    await this.paymentRepository.create(payment);

    return right({
      payment,
    });
  }
}
