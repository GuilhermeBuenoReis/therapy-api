import type { User } from '../../src/core/entities/user';
import type { UserRepository } from '../../src/core/repositories/user-repository';

export class InMemoryUserRepository implements UserRepository {
  public items: User[] = [];

  async findByEmail(email: string): Promise<User | null> {
    const user = this.items.find(item => item.email === email);

    if (!user) {
      return null;
    }
    return user;
  }

  async findById(id: string): Promise<User | null> {
    const user = await this.items.find(item => item.id.toString() === id);

    if (!user) {
      return null;
    }
    return user;
  }

  async create(user: User): Promise<void> {
    this.items.push(user);
  }

  async save(user: User): Promise<void> {
    const itemIndex = this.items.findIndex(item => item.id === user.id);

    this.items[itemIndex] = user;
  }

  async delete(user: User): Promise<void> {
    const itemIndex = this.items.findIndex(
      item => item.id.toString() === user.id.toString()
    );

    this.items.splice(itemIndex, 1);
  }
}
