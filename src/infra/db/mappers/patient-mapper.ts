import { Patient } from '@/core/entities/patient';
import { UniqueEntityID } from '@/core/utils/unique-entity-id';
import type { patient } from '../schemas/patient';
import type { user } from '../schemas/user';

type PatientRow = typeof patient.$inferSelect & {
  user?: typeof user.$inferSelect | null;
};

type PatientInsert = typeof patient.$inferInsert;

export class PatientMapper {
  static toDomain(row: PatientRow): Patient | null {
    if (!row.user || !row.userId || !row.professionalId) {
      return null;
    }

    return Patient.create(
      {
        userId: row.userId,
        professionalsId: row.professionalId,
        name: row.user.name,
        birthDate: row.birthDate,
        phone: row.phone,
        note: row.note ?? '',
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      },
      new UniqueEntityID(row.id)
    );
  }

  static toDatabase(patient: Patient): PatientInsert & { id: string } {
    return {
      id: patient.id.toString(),
      userId: patient.userId,
      professionalId: patient.professionalsId,
      birthDate: patient.birthDate,
      phone: patient.phone,
      note: patient.note,
      createdAt: patient.createdAt,
      updatedAt: patient.updatedAt ?? null,
    };
  }
}
