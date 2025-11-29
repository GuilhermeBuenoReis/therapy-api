import type { Professionals } from '../../src/core/entities/professionals';
import type { ProfessionalsRepository } from '../../src/core/repositories/professionals-repository';

export class InMemoryProfessionalsRepository
  implements ProfessionalsRepository
{
  public items: Professionals[] = [];

  async findById(id: string): Promise<Professionals | null> {
    const professional = this.items.find(item => item.id.toString() === id);

    if (!professional) {
      return null;
    }
    return professional;
  }

  async findByUserId(userId: string): Promise<Professionals | null> {
    const professional = this.items.find(
      item => item.userId.toString() === userId
    );

    if (!professional) {
      return null;
    }
    return professional;
  }

  async create(professionals: Professionals): Promise<void> {
    this.items.push(professionals);
  }

  async save(professionals: Professionals): Promise<void> {
    const itemIndex = this.items.findIndex(
      item => item.id === professionals.id
    );

    this.items[itemIndex] = professionals;
  }

  async delete(professionals: Professionals): Promise<void> {
    const itemIndex = this.items.findIndex(
      item => item.id.toString() === professionals.id.toString()
    );

    this.items.splice(itemIndex, 1);
  }
}
