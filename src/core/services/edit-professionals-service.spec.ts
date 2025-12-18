import { beforeEach, describe, expect, it } from 'vitest';
import { InMemoryProfessionalsRepository } from '../../../test/repositories/in-memory-professionals-repository';
import { Professionals } from '../entities/professionals';
import { UniqueEntityID } from '../utils/unique-entity-id';
import { EditProfessionalsService } from './edit-professionals-service';
import { ProfessionalNotFoundError } from './errors/professional-not-found-error';

let sut: EditProfessionalsService;
let inMemoryProfessionalsRepository: InMemoryProfessionalsRepository;

describe('Edit Professionals Service', () => {
  beforeEach(() => {
    inMemoryProfessionalsRepository = new InMemoryProfessionalsRepository();
    sut = new EditProfessionalsService(inMemoryProfessionalsRepository);
  });

  it('should be able to edit a professionals', async () => {
    const professionalsId = new UniqueEntityID('professionals-01');
    const professionals = Professionals.create(
      {
        userId: new UniqueEntityID('user-01'),
        biography: 'old bio',
        monthlyPrice: 100,
        phone: '111111111',
        pricePerSession: 50,
        registration_number: 'reg-01',
        sessionDuration: 60,
        specialty: 'old specialty',
      },
      professionalsId
    );

    await inMemoryProfessionalsRepository.create(professionals);

    const result = await sut.handle({
      professionalsId: professionalsId.toString(),
      biography: 'new bio',
      monthlyPrice: 200,
      phone: '222222222',
      pricePerSession: 150,
      registration_number: 'reg-02',
      sessionDuration: 90,
      specialty: 'new specialty',
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      const updated = result.value.professionals;
      expect(updated.biography).toBe('new bio');
      expect(updated.monthlyPrice).toBe(200);
      expect(updated.phone).toBe('222222222');
      expect(updated.pricePerSession).toBe(150);
      expect(updated.registration_number).toBe('reg-02');
      expect(updated.sessionDuration).toBe(90);
      expect(updated.specialty).toBe('new specialty');
      expect(updated.id.toString()).toBe('professionals-01');
      expect(updated.updatedAt).toBeInstanceOf(Date);
    }
  });

  it('should return left when trying to edit a non-existent professionals', async () => {
    const result = await sut.handle({
      professionalsId: 'missing-id',
      biography: 'new bio',
      monthlyPrice: 200,
      phone: '222222222',
      pricePerSession: 150,
      registration_number: 'reg-02',
      sessionDuration: 90,
      specialty: 'new specialty',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ProfessionalNotFoundError);
    }
  });
});
