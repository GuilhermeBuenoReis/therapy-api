import type { Payment } from '../entities/payment';
import type { PaymentRepository } from '../repositories/payment-repository';
import { type Either, left, right } from '../utils/either';
import { ErrorLatestPaymentForPatientNotFound } from './errors/error-latest-payment-for-patient-not-found';
import type { ErrorPatientNotFound } from './errors/patient-not-found';
import type { ErrorPatientNotLinkedToProfessional } from './errors/patient-not-linked-to-a-professional';
import type { VerifyProfessionalHasAccessToPatient } from './rules/verify-professional-has-access-to-patient';

export interface FindLatestPaymentForPatientServiceRequest {
  patientId: string;
  professionalId: string;
}

type FindLatestPaymentForPatientServiceResponse = Either<
  | ErrorLatestPaymentForPatientNotFound
  | ErrorPatientNotFound
  | ErrorPatientNotLinkedToProfessional,
  { payment: Payment }
>;

export class FindLatestPaymentForPatientService {
  constructor(
    private paymentRepository: PaymentRepository,
    private verifyAccess: VerifyProfessionalHasAccessToPatient
  ) {}

  async handle({
    patientId,
    professionalId,
  }: FindLatestPaymentForPatientServiceRequest): Promise<FindLatestPaymentForPatientServiceResponse> {
    const access = await this.verifyAccess.execute({
      patientId,
      professionalId,
    });

    if (access.isLeft()) {
      return left(access.value);
    }

    const payment =
      await this.paymentRepository.findLatestForPatient(patientId);

    if (!payment) {
      return left(new ErrorLatestPaymentForPatientNotFound());
    }

    return right({ payment });
  }
}
