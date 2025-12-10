import type { Patient } from '../entities/patient';
import type { PatientRepository } from '../repositories/patient-repository';
import { type Either, left, right } from '../utils/either';
import type { SubscriptionAccessMiddleware } from './rules/check-subscription-status-middleware';
import { ErrorPatientNotFound } from './errors/patient-not-found';

interface EditPatientServiceRequest {
  professionalId: string;
  patientId: string;
  name: string;
  birthDate: string;
  phone: string;
  note: string;
}

type EditPatientServiceResponse = Either<
  ErrorPatientNotFound,
  {
    patient: Patient;
  }
>;

export class EditPatientService {
  constructor(
    private patientRepository: PatientRepository,
    private subscriptionMiddleware: SubscriptionAccessMiddleware
  ) { }

  async handle({
    professionalId,
    patientId,
    birthDate,
    name,
    note,
    phone,
  }: EditPatientServiceRequest): Promise<EditPatientServiceResponse> {
    const patient = await this.patientRepository.findById(patientId);

    if (!patient) {
      return left(new ErrorPatientNotFound());
    }

    const subscriptionCheck = await this.subscriptionMiddleware.enforceAccess({
      professionalId,
      operation: 'write',
    });

    if (subscriptionCheck.isLeft()) {
      return left(subscriptionCheck.value);
    }

    patient.name = name;
    patient.birthDate = birthDate;
    patient.phone = phone;
    patient.note = note;

    await this.patientRepository.save(patient);

    return right({
      patient,
    });
  }
}
