import { desc, eq } from 'drizzle-orm';
import type { Patient } from '@/core/entities/patient';
import type { PatientRepository } from '@/core/repositories/patient-repository';
import { db } from '..';
import { PatientMapper } from '../mappers/patient-mapper';
import { patient as patientSchema } from '../schemas/patient';
import { user as userSchema } from '../schemas/user';

export class DrizzlePatientRepository implements PatientRepository {
  async findById(id: string): Promise<Patient | null> {
    const patientRow = await db.query.patient.findFirst({
      where: eq(patientSchema.id, id),
      with: {
        user: true,
      },
    });

    if (!patientRow) {
      return null;
    }

    return PatientMapper.toDomain(patientRow);
  }

  async findByUserId(userId: string): Promise<Patient | null> {
    const patientRow = await db.query.patient.findFirst({
      where: eq(patientSchema.userId, userId),
      with: {
        user: true,
      },
    });

    if (!patientRow) {
      return null;
    }

    return PatientMapper.toDomain(patientRow);
  }

  async findByProfessionalsId(
    professionalsId: string
  ): Promise<Patient | null> {
    const patientRow = await db.query.patient.findFirst({
      where: eq(patientSchema.professionalId, professionalsId),
      with: {
        user: true,
      },
    });

    if (!patientRow) {
      return null;
    }

    return PatientMapper.toDomain(patientRow);
  }

  async findManyByProfessional(professionalId: string): Promise<Patient[]> {
    const rows = await db.query.patient.findMany({
      where: eq(patientSchema.professionalId, professionalId),
      with: {
        user: true,
      },
      orderBy: [desc(patientSchema.createdAt)],
    });

    return rows
      .map((row) => PatientMapper.toDomain(row))
      .filter((patient): patient is Patient => patient !== null);
  }

  async create(patient: Patient): Promise<void> {
    const data = PatientMapper.toDatabase(patient);

    await db.transaction(async (trx) => {
      await trx
        .update(userSchema)
        .set({
          name: patient.name,
          updatedAt: new Date(),
        })
        .where(eq(userSchema.id, patient.userId));

      await trx.insert(patientSchema).values(data);
    });
  }

  async save(patient: Patient): Promise<void> {
    const data = PatientMapper.toDatabase(patient);

    await db.transaction(async (trx) => {
      await trx
        .update(userSchema)
        .set({
          name: patient.name,
          updatedAt: new Date(),
        })
        .where(eq(userSchema.id, patient.userId));

      await trx
        .update(patientSchema)
        .set({
          professionalId: data.professionalId,
          birthDate: data.birthDate,
          phone: data.phone,
          note: data.note,
          updatedAt: data.updatedAt ?? new Date(),
        })
        .where(eq(patientSchema.id, patient.id.toString()));
    });
  }

  async delete(patient: Patient): Promise<void> {
    await db
      .delete(patientSchema)
      .where(eq(patientSchema.id, patient.id.toString()));
  }
}
