import type { Payment } from '../entities/payment';
import type { PaymentRepository } from '../repositories/payment-repository';
import { type Either, left, right } from '../utils/either';
import { ErrorPaymentsForPatientNotFound } from './errors/error-payments-for-patient-not-found';
import type { ErrorPatientNotFound } from './errors/patient-not-found';
import type { ErrorPatientNotLinkedToProfessional } from './errors/patient-not-linked-to-a-professional';
import type { VerifyProfessionalHasAccessToPatient } from './rules/verify-professional-has-access-to-patient';

export interface FindPaymentsByPatientIdServiceRequest {
  patientId: string;
  professionalId: string;
}

type FindPaymentsByPatientIdServiceResponse = Either<
  | ErrorPaymentsForPatientNotFound
  | ErrorPatientNotFound
  | ErrorPatientNotLinkedToProfessional,
  { payments: Payment[] }
>;

export class FindPaymentsByPatientIdService {
  constructor(
    private paymentRepository: PaymentRepository,
    private verifyAccess: VerifyProfessionalHasAccessToPatient
  ) { }

  async handle({
    patientId,
    professionalId,
  }: FindPaymentsByPatientIdServiceRequest): Promise<FindPaymentsByPatientIdServiceResponse> {
    const access = await this.verifyAccess.execute({
      patientId,
      professionalId,
    });

    if (access.isLeft()) {
      return left(access.value);
    }

    const payments = await this.paymentRepository.findByPatientId(patientId);

    if (payments.length === 0) {
      return left(new ErrorPaymentsForPatientNotFound());
    }

    return right({ payments });
  }
}
