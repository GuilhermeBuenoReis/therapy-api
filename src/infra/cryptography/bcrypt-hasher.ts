import { compare, hash } from 'bcryptjs';
import type { HashComparer } from '@/core/utils/cryptography/hash-comparer';
import type { HashGenerator } from '@/core/utils/cryptography/hash-generator';

export class BcryptHasher implements HashGenerator, HashComparer {
  constructor(private readonly saltRounds = 10) {}

  async hash(plain: string): Promise<string> {
    return hash(plain, this.saltRounds);
  }

  async compare(plain: string, hashed: string): Promise<boolean> {
    return compare(plain, hashed);
  }
}
