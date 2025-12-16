import { User, UserRole } from '@/core/entities/user';
import { UniqueEntityID } from '@/core/utils/unique-entity-id';
import type { user, userRoleEnum } from '../schemas/user';

type UserRow = typeof user.$inferSelect;
type UserInsert = typeof user.$inferInsert;
type UserSelect = typeof user.$inferInsert;
type UserRoleDb = (typeof userRoleEnum.enumValues)[number];

export class UserMapper {
  static toDomain(row: UserRow): User {
    return User.create(
      {
        name: row.name,
        email: row.email,
        password: row.password,
        role:
          row.role === 'professional'
            ? UserRole.Professional
            : UserRole.Patient,
        paymentConfirmedAt: row.paymentConfirmedAt,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      },
      new UniqueEntityID(row.id)
    );
  }

  static toDatabase(user: User): UserInsert & { id: string } {
    return {
      id: user.id.toString(),
      name: user.name,
      email: user.email,
      password: user.password,
      role: user.role as UserRoleDb,
      paymentConfirmedAt: user.paymentConfirmedAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt ?? null,
    };
  }

  static toDatabaseSelect(user: User): UserSelect & { id: string } {
    return {
      id: user.id.toString(),
      name: user.name,
      email: user.email,
      password: user.password,
      role: user.role as UserRoleDb,
      paymentConfirmedAt: user.paymentConfirmedAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt ?? null,
    };
  }
}
