import { beforeEach, describe, expect, it } from 'vitest';
import { InMemorySessionRepository } from '../../../test/repositories/in-memory-session-repository';
import { Session, SessionStatus } from '../entities/session';
import { UniqueEntityID } from '../utils/unique-entity-id';
import { DeleteSessionService } from './delete-session-service';
import { ErrorSessionNotFound } from './errors/session-not-found-error';

let sut: DeleteSessionService;
let inMemorySessionRepository: InMemorySessionRepository;

describe('Delete Session Service', () => {
  beforeEach(() => {
    inMemorySessionRepository = new InMemorySessionRepository();
    sut = new DeleteSessionService(inMemorySessionRepository);
  });

  it('should be able to delete a session', async () => {
    const sessionId = new UniqueEntityID('session-01');
    const session = Session.create(
      {
        patientId: 'patient-01',
        professionalId: 'professional-01',
        price: 100,
        notes: 'Session to delete',
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
    expect(inMemorySessionRepository.items).toHaveLength(0);
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
