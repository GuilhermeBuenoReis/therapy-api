import type { User } from '../entities/user';

export interface UserRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  create(user: User): Promise<void>;
  save(user: User): Promise<void>;
  delete(user: User): Promise<void>;
}
