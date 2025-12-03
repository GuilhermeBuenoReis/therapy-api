import type { Patient } from '../entities/patient';

export interface PatientRepository {
  findById(id: string): Promise<Patient | null>;
  findByUserId(userId: string): Promise<Patient | null>;
  findByProfessionalsId(professionalsId: string): Promise<Patient | null>;
  findManyByProfessional(professionalId: string): Promise<Patient[]>;
  create(patient: Patient): Promise<void>;
  save(patient: Patient): Promise<void>;
  delete(patient: Patient): Promise<void>;
}
