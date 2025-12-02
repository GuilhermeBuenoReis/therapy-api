import type { Payment } from '../entities/payment';

export interface PaymentRepository {
  findById(id: string): Promise<Payment | null>;
  findByProfessionalId(professionalId: string): Promise<Payment[]>;
  findByPatientId(patientId: string): Promise<Payment[]>;
  findLatestForPatient(patientId: string): Promise<Payment | null>;
  findSessionPayment(sessionId: string): Promise<Payment | null>;
  create(payment: Payment): Promise<void>;
}
