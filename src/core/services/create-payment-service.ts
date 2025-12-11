import { type MethodEnum, Payment, type TypeEnum } from '../entities/payment';
import type { PaymentRepository } from '../repositories/payment-repository';
import { type Either, right } from '../utils/either';
import { UniqueEntityID } from '../utils/unique-entity-id';

export interface CreatePaymentServiceRequest {
  professionalId: string;
  subscriptionId?: string | null;
  type: TypeEnum;
  amount: number;
  paidAt: Date;
  method: MethodEnum;
  notes?: string | null;
}

type CreatePaymentServiceResponse = Either<
  never,
  { payment: Payment }
>;

export class CreatePaymentService {
  constructor(private paymentRepository: PaymentRepository) {}

  async handle({
    professionalId,
    subscriptionId,
    type,
    amount,
    paidAt,
    method,
    notes,
  }: CreatePaymentServiceRequest): Promise<CreatePaymentServiceResponse> {
    const payment = Payment.create(
      {
        professionalId,
        subscriptionId: subscriptionId ?? null,
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
