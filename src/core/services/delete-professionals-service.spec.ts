import { beforeEach, describe, expect, it } from 'vitest';
import { InMemoryProfessionalsRepository } from '../../../test/repositories/in-memory-professionals-repository';
import { Professionals } from '../entities/professionals';
import { UniqueEntityID } from '../utils/unique-entity-id';
import { DeleteProfessionalsService } from './delete-professionals-service';
import { ErrorProfessionalsNotFound } from './errors/professionals-not-found';

let sut: DeleteProfessionalsService;
let inMemoryProfessionalsRepository: InMemoryProfessionalsRepository;

describe('Delete Professionals Service', () => {
  beforeEach(() => {
    inMemoryProfessionalsRepository = new InMemoryProfessionalsRepository();
    sut = new DeleteProfessionalsService(inMemoryProfessionalsRepository);
  });

  it('should be able to delete a professionals', async () => {
    const professionalsId = new UniqueEntityID('professionals-01');
    const professionals = Professionals.create(
      {
        userId: new UniqueEntityID('user-01'),
        biography: 'bio',
        monthlyPrice: 100,
        phone: '123456789',
        pricePerSession: 50,
        registration_number: 'reg-01',
        sessionDuration: 60,
        specialty: 'specialty',
      },
      professionalsId
    );

    await inMemoryProfessionalsRepository.create(professionals);

    const result = await sut.handle({
      professionalsId: professionalsId.toString(),
    });

    expect(result.isRight()).toBe(true);
    expect(inMemoryProfessionalsRepository.items).toHaveLength(0);
  });

  it('should return left when professionals does not exist', async () => {
    const result = await sut.handle({
      professionalsId: 'missing-id',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ErrorProfessionalsNotFound);
    }
  });
});
