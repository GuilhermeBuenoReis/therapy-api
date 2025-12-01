import type { Patient } from '../entities/patient';
import type { PatientRepository } from '../repositories/patient-repository';
import { type Either, left, right } from '../utils/either';
import { PatientNotFound } from './errors/patient-not-found';

interface EditPatientServiceRequest {
  patientId: string;
  name: string;
  birthDate: string;
  phone: string;
  note: string;
}

type EditPatientServiceResponse = Either<
  PatientNotFound,
  {
    patient: Patient;
  }
>;

export class EditPatientService {
  constructor(private patientRepository: PatientRepository) {}

  async handle({
    patientId,
    birthDate,
    name,
    note,
    phone,
  }: EditPatientServiceRequest): Promise<EditPatientServiceResponse> {
    const patient = await this.patientRepository.findById(patientId);

    if (!patient) {
      return left(new PatientNotFound());
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
