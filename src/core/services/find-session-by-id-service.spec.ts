import { beforeEach, describe, expect, it } from 'vitest';
import { InMemorySessionRepository } from '../../../test/repositories/in-memory-session-repository';
import { Session, SessionStatus } from '../entities/session';
import { UniqueEntityID } from '../utils/unique-entity-id';
import { ErrorSessionNotFound } from './errors/session-not-found-error';
import { FindSessionByIdService } from './find-session-by-id-service';

let sut: FindSessionByIdService;
let inMemorySessionRepository: InMemorySessionRepository;

describe('Find Session By Id Service', () => {
  beforeEach(() => {
    inMemorySessionRepository = new InMemorySessionRepository();
    sut = new FindSessionByIdService(inMemorySessionRepository);
  });

  it('should be able to find a session by id', async () => {
    const sessionId = new UniqueEntityID('session-01');
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
      sessionId
    );

    await inMemorySessionRepository.create(session);

    const result = await sut.handle({
      sessionId: sessionId.toString(),
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.session.id.toString()).toBe('session-01');
    }
  });

  it('should return left when session does not exist', async () => {
    const result = await sut.handle({
      sessionId: 'missing-id',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ErrorSessionNotFound);
    }
  });
});
