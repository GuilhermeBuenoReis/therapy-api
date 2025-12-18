import { MethodEnum, Payment, TypeEnum } from '@/core/entities/payment';
import { UniqueEntityID } from '@/core/utils/unique-entity-id';
import type { payment } from '../schemas/payment';

type PaymentRow = typeof payment.$inferSelect;
type PaymentInsert = typeof payment.$inferInsert;

export class PaymentMapper {
  static toDomain(row: PaymentRow): Payment {
    return Payment.create(
      {
        professionalId: row.professionalId,
        subscriptionId: row.subscriptionId,
        type: row.type as TypeEnum,
        amount: row.amount,
        paidAt: row.paidAt,
        method: row.method as MethodEnum,
        notes: row.notes,
        createdAt: row.createdAt,
      },
      new UniqueEntityID(row.id)
    );
  }

  static toDatabase(payment: Payment): PaymentInsert & { id: string } {
    return {
      id: payment.id.toString(),
      professionalId: payment.professionalId,
      subscriptionId: payment.subscriptionId,
      type: payment.type,
      amount: payment.amount,
      paidAt: payment.paidAt,
      method: payment.method,
      notes: payment.notes,
      createdAt: payment.createdAt,
    };
  }
}
