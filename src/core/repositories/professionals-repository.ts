import type { Professionals } from '../entities/professionals';

export interface ProfessionalsRepository {
  findById(id: string): Promise<Professionals | null>;
  findByUserId(userId: string): Promise<Professionals | null>;
  create(professionals: Professionals): Promise<void>;
  save(professionals: Professionals): Promise<void>;
  delete(professionals: Professionals): Promise<void>;
}
