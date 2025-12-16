import { eq } from 'drizzle-orm';
import type { Professionals } from '@/core/entities/professionals';
import type { ProfessionalsRepository } from '@/core/repositories/professionals-repository';
import { db } from '..';
import { ProfessionalMapper } from '../mappers/professional-mapper';
import { professional as professionalSchema } from '../schemas/professional';

export class DrizzleProfessionalRepository implements ProfessionalsRepository {
  async findById(id: string): Promise<Professionals | null> {
    const [row] = await db
      .select()
      .from(professionalSchema)
      .where(eq(professionalSchema.id, id))
      .limit(1);

    if (!row) {
      return null;
    }

    return ProfessionalMapper.toDomain(row);
  }

  async findByUserId(userId: string): Promise<Professionals | null> {
    const [row] = await db
      .select()
      .from(professionalSchema)
      .where(eq(professionalSchema.userId, userId))
      .limit(1);

    if (!row) {
      return null;
    }

    return ProfessionalMapper.toDomain(row);
  }

  async create(professional: Professionals): Promise<void> {
    const data = ProfessionalMapper.toDatabase(professional);
    await db.insert(professionalSchema).values(data);
  }

  async save(professional: Professionals): Promise<void> {
    const data = ProfessionalMapper.toDatabase(professional);
    await db
      .update(professionalSchema)
      .set({
        specialty: data.specialty,
        registrationNumber: data.registrationNumber,
        phone: data.phone,
        biography: data.biography,
        pricePerSession: data.pricePerSession,
        monthlyPrice: data.monthlyPrice,
        sessionDuration: data.sessionDuration,
        updatedAt: data.updatedAt,
      })
      .where(eq(professionalSchema.id, data.id));
  }

  async delete(professional: Professionals): Promise<void> {
    await db
      .delete(professionalSchema)
      .where(eq(professionalSchema.id, professional.id.toString()));
  }
}
