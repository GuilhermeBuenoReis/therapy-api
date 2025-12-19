import type { Payment } from '@/core/entities/payment';

export class PaymentPresenter {
  static toHTTP(payment: Payment) {
    return {
      id: payment.id.toString(),
      professionalId: payment.professionalId,
      subscriptionId: payment.subscriptionId,
      type: payment.type,
      amount: payment.amount,
      paidAt: payment.paidAt.toISOString(),
      method: payment.method,
      notes: payment.notes ?? null,
      createdAt: payment.createdAt.toISOString(),
    };
  }
}
