import type { Patient } from '../../src/core/entities/patient';
import type { PatientRepository } from '../../src/core/repositories/patient-repository';

export class InMemoryPatientRepository implements PatientRepository {
  public items: Patient[] = [];

  async findById(id: string): Promise<Patient | null> {
    const patient = this.items.find(item => item.id.toString() === id);

    if (!patient) {
      return null;
    }
    return patient;
  }

  async findByUserId(userId: string): Promise<Patient | null> {
    const patient = this.items.find(item => item.userId === userId);

    if (!patient) {
      return null;
    }
    return patient;
  }

  async findByProfessionalsId(
    professionalsId: string
  ): Promise<Patient | null> {
    const patient = this.items.find(
      item => item.professionalsId === professionalsId
    );

    if (!patient) {
      return null;
    }
    return patient;
  }

  async create(patient: Patient): Promise<void> {
    this.items.push(patient);
  }

  async findManyByProfessional(professionalId: string): Promise<Patient[]> {
    return this.items.filter(
      patient => patient.professionalsId === professionalId
    );
  }

  async save(patient: Patient): Promise<void> {
    const itemIndex = this.items.findIndex(item => item.id === patient.id);

    this.items[itemIndex] = patient;
  }

  async delete(patient: Patient): Promise<void> {
    const itemIndex = this.items.findIndex(
      item => item.id.toString() === patient.id.toString()
    );

    this.items.splice(itemIndex, 1);
  }
}
