import type { Payment } from '../entities/payment';

export interface PaymentRepository {
  findById(id: string): Promise<Payment | null>;
  findByProfessionalId(professionalId: string): Promise<Payment[]>;
  findLatestForProfessional(professionalId: string): Promise<Payment | null>;
  create(payment: Payment): Promise<void>;
}
