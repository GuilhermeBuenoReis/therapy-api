import { desc, eq } from 'drizzle-orm';
import type { Payment } from '@/core/entities/payment';
import type { PaymentRepository } from '@/core/repositories/payment-repository';
import { db } from '..';
import { PaymentMapper } from '../mappers/payment-mapper';
import { payment as paymentSchema } from '../schemas/payment';

export class DrizzlePaymentRepository implements PaymentRepository {
  async findById(id: string): Promise<Payment | null> {
    const paymentRow = await db.query.payment.findFirst({
      where: eq(paymentSchema.id, id),
    });

    if (!paymentRow) {
      return null;
    }

    return PaymentMapper.toDomain(paymentRow);
  }

  async findByProfessionalId(professionalId: string): Promise<Payment[]> {
    const rows = await db.query.payment.findMany({
      where: eq(paymentSchema.professionalId, professionalId),
      orderBy: [desc(paymentSchema.paidAt)],
    });

    return rows.map((row) => PaymentMapper.toDomain(row));
  }

  async findLatestForProfessional(
    professionalId: string
  ): Promise<Payment | null> {
    const [row] = await db
      .select()
      .from(paymentSchema)
      .where(eq(paymentSchema.professionalId, professionalId))
      .orderBy(desc(paymentSchema.paidAt))
      .limit(1);

    if (!row) {
      return null;
    }

    return PaymentMapper.toDomain(row);
  }

  async create(payment: Payment): Promise<void> {
    const data = PaymentMapper.toDatabase(payment);
    await db.insert(paymentSchema).values(data);
  }
}
