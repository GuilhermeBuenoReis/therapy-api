import { faker } from '@faker-js/faker';
import { Patient } from '../../src/core/entities/patient';
import { UniqueEntityID } from '../../src/core/utils/unique-entity-id';

type PatientOverride = Partial<{
  userId: string;
  professionalsId: string;
  name: string;
  birthDate: string;
  phone: string;
  note: string;
  createdAt: Date;
  updatedAt: Date | null;
}>;

export function makePatient(
  override: PatientOverride = {},
  id?: UniqueEntityID
) {
  const patient = Patient.create(
    {
      userId: override.userId ?? new UniqueEntityID().toString(),
      professionalsId:
        override.professionalsId ?? new UniqueEntityID().toString(),
      name: override.name ?? faker.person.fullName(),
      birthDate:
        override.birthDate ??
        faker.date
          .birthdate({ min: 1950, max: 2010, mode: 'year' })
          .toISOString()
          .slice(0, 10),
      phone: override.phone ?? faker.phone.number(),
      note: override.note ?? faker.lorem.sentence(),
      createdAt: override.createdAt,
      updatedAt: override.updatedAt,
    },
    id
  );

  return patient;
}
