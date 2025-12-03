import { beforeEach, describe, expect, it } from 'vitest';
import { makeProfessionals } from '../../../test/factories/make-professionals';
import { makeSession } from '../../../test/factories/make-session';
import { InMemoryProfessionalsRepository } from '../../../test/repositories/in-memory-professionals-repository';
import { InMemorySessionRepository } from '../../../test/repositories/in-memory-session-repository';
import { UniqueEntityID } from '../utils/unique-entity-id';
import { ErrorProfessionalsNotFound } from './errors/professionals-not-found';
import { GetSessionsByProfessionalService } from './get-sessions-by-professionals-service';

let sut: GetSessionsByProfessionalService;
let inMemoryProfessionalsRepository: InMemoryProfessionalsRepository;
let inMemorySessionRepository: InMemorySessionRepository;

describe('Get Sessions By Professional Service', () => {
  beforeEach(() => {
    inMemoryProfessionalsRepository = new InMemoryProfessionalsRepository();
    inMemorySessionRepository = new InMemorySessionRepository();

    sut = new GetSessionsByProfessionalService(
      inMemoryProfessionalsRepository,
      inMemorySessionRepository
    );
  });

  it('should return sessions for an existing professional', async () => {
    const professional = makeProfessionals(
      {},
      new UniqueEntityID('professional-01')
    );

    await inMemoryProfessionalsRepository.create(professional);

    const session1 = makeSession({
      professionalId: professional.id.toString(),
    });

    const session2 = makeSession({
      professionalId: professional.id.toString(),
    });

    await inMemorySessionRepository.create(session1);
    await inMemorySessionRepository.create(session2);

    const result = await sut.handle({
      professionalId: professional.id.toString(),
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.sessions).toHaveLength(2);
      expect(result.value.sessions[0].professionalId).toBe(
        professional.id.toString()
      );
      expect(result.value.sessions[1].professionalId).toBe(
        professional.id.toString()
      );
    }
  });

  it('should return error when professional does not exist', async () => {
    const result = await sut.handle({
      professionalId: 'non-existent-professional',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ErrorProfessionalsNotFound);
    }
  });
});
