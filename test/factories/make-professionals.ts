import { faker } from '@faker-js/faker';
import {
  Professionals,
  type ProfessionalsProps,
} from '../../src/core/entities/professionals';
import { UniqueEntityID } from '../../src/core/utils/unique-entity-id';

type ProfessionalsOverride = Partial<ProfessionalsProps>;

export function makeProfessionals(
  override: ProfessionalsOverride = {},
  id?: UniqueEntityID
) {
  const professionals = Professionals.create(
    {
      userId: override.userId ?? new UniqueEntityID(),
      specialty:
        override.specialty ??
        faker.helpers.arrayElement(['therapy', 'pediatrics', 'cardiology']),
      registration_number:
        override.registration_number ??
        faker.string.alphanumeric({ length: 8 }).toUpperCase(),
      phone: override.phone ?? faker.phone.number(),
      biography:
        override.biography ?? faker.lorem.sentence({ min: 6, max: 12 }),
      pricePerSession: override.pricePerSession ?? faker.number.int({ min: 80, max: 200 }),
      monthlyPrice: override.monthlyPrice ?? faker.number.int({ min: 250, max: 800 }),
      sessionDuration: override.sessionDuration ?? faker.number.int({ min: 30, max: 90 }),
      createdAt: override.createdAt ?? new Date(),
      updatedAt: override.updatedAt ?? null,
    },
    id
  );

  return professionals;
}
