import { eq } from 'drizzle-orm';
import type { User } from '@/core/entities/user';
import type { UserRepository } from '@/core/repositories/user-repository';
import { db } from '..';
import { UserMapper } from '../mappers/user-mapper';
import { user as userSchema } from '../schemas/user';

export class DrizzleUserRepository implements UserRepository {
  async findByEmail(email: string): Promise<User | null> {
    const [userRow] = await db
      .select()
      .from(userSchema)
      .where(eq(userSchema.email, email))
      .limit(1);

    if (!userRow) {
      return null;
    }

    return UserMapper.toDomain(userRow);
  }

  async findById(id: string): Promise<User | null> {
    const [userRow] = await db
      .select()
      .from(userSchema)
      .where(eq(userSchema.id, id))
      .limit(1);

    if (!userRow) {
      return null;
    }

    return UserMapper.toDomain(userRow);
  }

  async create(user: User): Promise<void> {
    const userData = UserMapper.toDatabase(user);

    await db.insert(userSchema).values(userData);
  }

  async save(user: User): Promise<void> {
    const userData = UserMapper.toDatabase(user);

    await db
      .update(userSchema)
      .set({
        name: userData.name,
        email: userData.email,
        password: userData.password,
        role: userData.role,
        paymentConfirmedAt: userData.paymentConfirmedAt,
        updatedAt: userData.updatedAt,
      })
      .where(eq(userSchema.id, userData.id));
  }

  async delete(user: User): Promise<void> {
    await db.delete(userSchema).where(eq(userSchema.id, user.id.toString()));
  }
}
