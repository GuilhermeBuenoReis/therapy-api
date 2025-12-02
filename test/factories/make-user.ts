import { faker } from '@faker-js/faker';
import { User } from '../../src/core/entities/user';
import type { UniqueEntityID } from '../../src/core/utils/unique-entity-id';

type UserOverride = Partial<{
  name: string;
  email: string;
  password: string;
}>;

export function makeUser(override: UserOverride = {}, id?: UniqueEntityID) {
  const user = User.create(
    {
      name: faker.person.fullName(),
      email: faker.internet.email(),
      password: faker.internet.password(),
      ...override,
    },
    id
  );

  return user;
}
