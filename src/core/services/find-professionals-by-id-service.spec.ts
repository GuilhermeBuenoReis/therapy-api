import { beforeEach, describe, expect, it } from 'vitest';
import { InMemoryProfessionalsRepository } from '../../../test/repositories/in-memory-professionals-repository';
import { Professionals } from '../entities/professionals';
import { UniqueEntityID } from '../utils/unique-entity-id';
import { ProfessionalNotFoundError } from './errors/professional-not-found-error';
import { FindProfessionalsByIdService } from './find-professionals-by-id-service';

let sut: FindProfessionalsByIdService;
let inMemoryProfessionalsRepository: InMemoryProfessionalsRepository;

describe('Find Professionals By Id Service', () => {
  beforeEach(() => {
    inMemoryProfessionalsRepository = new InMemoryProfessionalsRepository();

    sut = new FindProfessionalsByIdService(inMemoryProfessionalsRepository);
  });

  it('should be able to find a professionals by id', async () => {
    const professionalsId = 'professionals-01';

    const professionals = Professionals.create(
      {
        userId: new UniqueEntityID('user-01'),
        biography: 'bio',
        monthlyPrice: 100,
        phone: '123456789',
        pricePerSession: 50,
        registration_number: '123456789',
        sessionDuration: 60,
        specialty: 'specialty',
      },
      new UniqueEntityID(professionalsId)
    );

    await inMemoryProfessionalsRepository.create(professionals);

    const result = await sut.handle({
      professionalId: professionals.id.toString(),
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.professional.id.toString()).toEqual(professionalsId);
    }
  });

  it('should be able return left when professionals not found', async () => {
    const result = await sut.handle({
      professionalId: 'missing-id',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ProfessionalNotFoundError);
    }
  });
});
