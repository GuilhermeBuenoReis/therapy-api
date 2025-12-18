import { Patient } from '../entities/patient';
import { UniqueEntityID } from '../utils/unique-entity-id';

interface CreatePatientEntityParams {
  userId: string;
  professionalId: string;
  name: string;
  birthDate: string;
  phone: string;
  note: string;
}

export function createPatientEntity({
  userId,
  professionalId,
  name,
  birthDate,
  phone,
  note,
}: CreatePatientEntityParams) {
  return Patient.create(
    {
      userId,
      professionalsId: professionalId,
      name,
      birthDate,
      phone,
      note,
    },
    new UniqueEntityID()
  );
}
