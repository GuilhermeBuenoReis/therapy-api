import type { Patient } from '@/core/entities/patient';

export class PatientPresenter {
  static toHTTP(patient: Patient) {
    return {
      id: patient.id.toString(),
      userId: patient.userId,
      professionalId: patient.professionalsId,
      name: patient.name,
      birthDate: patient.birthDate,
      phone: patient.phone,
      note: patient.note,
      createdAt: patient.createdAt.toISOString(),
      updatedAt: patient.updatedAt?.toISOString() ?? null,
    };
  }
}
