import type { Payment } from '../../src/core/entities/payment';
import type { PaymentRepository } from '../../src/core/repositories/payment-repository';

export class InMemoryPaymentRepository implements PaymentRepository {
  public items: Payment[] = [];

  async findById(id: string): Promise<Payment | null> {
    const payment = this.items.find(item => item.id.toString() === id);

    if (!payment) {
      return null;
    }
    return payment;
  }

  async findByProfessionalId(professionalId: string): Promise<Payment[]> {
    return this.items.filter(item => item.professionalId === professionalId);
  }

  async findLatestForProfessional(
    professionalId: string
  ): Promise<Payment | null> {
    const payments = this.items
      .filter(item => item.professionalId === professionalId)
      .sort((a, b) => b.paidAt.getTime() - a.paidAt.getTime());

    if (payments.length === 0) {
      return null;
    }
    return payments[0];
  }

  async create(payment: Payment): Promise<void> {
    this.items.push(payment);
  }
}
