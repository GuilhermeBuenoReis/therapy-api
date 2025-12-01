import { beforeEach, describe, expect, it } from 'vitest';
import { InMemorySessionRepository } from '../../../test/repositories/in-memory-session-repository';
import { Session, SessionStatus } from '../entities/session';
import { UniqueEntityID } from '../utils/unique-entity-id';
import { ErrorSessionNotFound } from './errors/session-not-found-error';
import { FindSessionByProfessionalIdService } from './find-session-by-professional-id-service';

let sut: FindSessionByProfessionalIdService;
let inMemorySessionRepository: InMemorySessionRepository;

describe('Find Session By Professional Id Service', () => {
  beforeEach(() => {
    inMemorySessionRepository = new InMemorySessionRepository();
    sut = new FindSessionByProfessionalIdService(inMemorySessionRepository);
  });

  it('should be able to find a session by professional id', async () => {
    const session = Session.create(
      {
        patientId: 'patient-01',
        professionalId: 'professional-01',
        price: 100,
        notes: 'Follow up',
        sessionDate: new Date('2024-01-01T10:00:00Z'),
        status: SessionStatus.scheduled,
        durationMinutes: 60,
      },
      new UniqueEntityID('session-01')
    );

    await inMemorySessionRepository.create(session);

    const result = await sut.handle({
      professionalId: 'professional-01',
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.session.professionalId).toBe('professional-01');
    }
  });

  it('should return left when session does not exist', async () => {
    const result = await sut.handle({
      professionalId: 'missing-professional',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ErrorSessionNotFound);
    }
  });
});
