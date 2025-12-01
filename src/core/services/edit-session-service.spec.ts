import { beforeEach, describe, expect, it } from 'vitest';
import { InMemorySessionRepository } from '../../../test/repositories/in-memory-session-repository';
import { Session, SessionStatus } from '../entities/session';
import { UniqueEntityID } from '../utils/unique-entity-id';
import { EditSessionService } from './edit-session-service';
import { ErrorSessionNotFound } from './errors/session-not-found-error';

let sut: EditSessionService;
let inMemorySessionRepository: InMemorySessionRepository;

describe('Edit Session Service', () => {
  beforeEach(() => {
    inMemorySessionRepository = new InMemorySessionRepository();
    sut = new EditSessionService(inMemorySessionRepository);
  });

  it('should be able to edit a session', async () => {
    const sessionId = new UniqueEntityID('session-01');
    const session = Session.create(
      {
        patientId: 'patient-01',
        professionalId: 'professional-01',
        price: 100,
        notes: 'First session',
        sessionDate: new Date('2024-01-01T10:00:00Z'),
        status: SessionStatus.scheduled,
        durationMinutes: 60,
      },
      sessionId
    );

    await inMemorySessionRepository.create(session);

    const result = await sut.handle({
      sessionId: sessionId.toString(),
      price: 150,
      notes: 'Updated notes',
      sessionDate: new Date('2024-01-02T12:00:00Z'),
      status: SessionStatus.done,
      durationMinutes: 90,
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      const updated = result.value.session;
      expect(updated.price).toBe(150);
      expect(updated.notes).toBe('Updated notes');
      expect(updated.sessionDate.toISOString()).toBe(
        new Date('2024-01-02T12:00:00Z').toISOString()
      );
      expect(updated.status).toBe(SessionStatus.done);
      expect(updated.durationMinutes).toBe(90);
      expect(updated.updatedAt).toBeInstanceOf(Date);
    }
  });

  it('should return left when session does not exist', async () => {
    const result = await sut.handle({
      sessionId: 'missing-id',
      price: 150,
      notes: 'Updated notes',
      sessionDate: new Date('2024-01-02T12:00:00Z'),
      status: SessionStatus.done,
      durationMinutes: 90,
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ErrorSessionNotFound);
    }
  });
});
