import { Professionals } from '@/core/entities/professionals';
import { UniqueEntityID } from '@/core/utils/unique-entity-id';
import type { professional } from '../schemas/professional';

type ProfessionalRow = typeof professional.$inferSelect;
type ProfessionalInsert = typeof professional.$inferInsert;

export class ProfessionalMapper {
  static toDomain(row: ProfessionalRow): Professionals {
    return Professionals.create(
      {
        userId: new UniqueEntityID(row.userId),
        specialty: row.specialty,
        registration_number: row.registrationNumber,
        phone: row.phone,
        biography: row.biography,
        pricePerSession: row.pricePerSession,
        monthlyPrice: row.monthlyPrice,
        sessionDuration: row.sessionDuration,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      },
      new UniqueEntityID(row.id)
    );
  }

  static toDatabase(entity: Professionals): ProfessionalInsert & { id: string } {
    return {
      id: entity.id.toString(),
      userId: entity.userId.toString(),
      specialty: entity.specialty,
      registrationNumber: entity.registration_number,
      phone: entity.phone,
      biography: entity.biography,
      pricePerSession: entity.pricePerSession,
      monthlyPrice: entity.monthlyPrice,
      sessionDuration: entity.sessionDuration,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt ?? null,
    };
  }
}
