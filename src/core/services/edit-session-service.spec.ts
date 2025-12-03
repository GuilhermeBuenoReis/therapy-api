import { beforeEach, describe, expect, it } from 'vitest';
import { InMemorySessionRepository } from '../../../test/repositories/in-memory-session-repository';
import { Session, SessionStatus } from '../entities/session';
import { UniqueEntityID } from '../utils/unique-entity-id';
import { EditSessionService } from './edit-session-service';
import { ErrorInvalidChronologicalStatus } from './errors/error-invalid-chronological-status';
import { ErrorInvalidSessionStatusTransition } from './errors/error-invalid-session-status-transition';
import { ErrorSessionNotFound } from './errors/session-not-found-error';

let sut: EditSessionService;
let inMemorySessionRepository: InMemorySessionRepository;

describe('Edit Session Service', () => {
  beforeEach(() => {
    inMemorySessionRepository = new InMemorySessionRepository();
    sut = new EditSessionService(inMemorySessionRepository);
  });

  it('should be able to edit a session with valid transition', async () => {
    const initialDate = new Date(Date.now() + 60 * 60 * 1000); // 1h in the future
    const sessionId = new UniqueEntityID('session-01');
    const session = Session.create(
      {
        patientId: 'patient-01',
        professionalId: 'professional-01',
        price: 100,
        notes: 'First session',
        sessionDate: initialDate,
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
      sessionDate: new Date(Date.now() - 30 * 60 * 1000), // 30m in the past
      status: SessionStatus.inProgress,
      durationMinutes: 90,
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      const updated = result.value.session;
      expect(updated.price).toBe(150);
      expect(updated.notes).toBe('Updated notes');
      expect(updated.status).toBe(SessionStatus.inProgress);
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
      status: SessionStatus.inProgress,
      durationMinutes: 90,
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ErrorSessionNotFound);
    }
  });

  it('should reject invalid status transition', async () => {
    const session = Session.create({
      patientId: 'patient-01',
      professionalId: 'professional-01',
      price: 100,
      notes: 'First session',
      sessionDate: new Date(Date.now() + 60 * 60 * 1000),
      status: SessionStatus.scheduled,
      durationMinutes: 60,
    });

    await inMemorySessionRepository.create(session);

    const result = await sut.handle({
      sessionId: session.id.toString(),
      price: 120,
      notes: 'Try invalid transition',
      sessionDate: new Date(Date.now() + 90 * 60 * 1000),
      status: SessionStatus.completed,
      durationMinutes: 60,
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(
        ErrorInvalidSessionStatusTransition
      );
    }
  });

  it('should not allow canceled session to go to completed', async () => {
    const session = Session.create({
      patientId: 'patient-01',
      professionalId: 'professional-01',
      price: 100,
      notes: 'Canceled session',
      sessionDate: new Date(Date.now() - 60 * 60 * 1000),
      status: SessionStatus.canceled,
      durationMinutes: 60,
    });

    await inMemorySessionRepository.create(session);

    const result = await sut.handle({
      sessionId: session.id.toString(),
      price: 100,
      notes: 'Try to complete canceled',
      sessionDate: new Date(Date.now() - 30 * 60 * 1000),
      status: SessionStatus.completed,
      durationMinutes: 60,
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(
        ErrorInvalidSessionStatusTransition
      );
    }
  });

  it('should not allow completed session to change status', async () => {
    const session = Session.create({
      patientId: 'patient-01',
      professionalId: 'professional-01',
      price: 100,
      notes: 'Completed session',
      sessionDate: new Date(Date.now() - 2 * 60 * 60 * 1000),
      status: SessionStatus.completed,
      durationMinutes: 60,
    });

    await inMemorySessionRepository.create(session);

    const result = await sut.handle({
      sessionId: session.id.toString(),
      price: 110,
      notes: 'Trying to reopen session',
      sessionDate: new Date(Date.now() - 60 * 60 * 1000),
      status: SessionStatus.inProgress,
      durationMinutes: 70,
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(
        ErrorInvalidSessionStatusTransition
      );
    }
  });

  it('should reject chronological violations when moving to in-progress in the future', async () => {
    const session = Session.create({
      patientId: 'patient-01',
      professionalId: 'professional-01',
      price: 100,
      notes: 'First session',
      sessionDate: new Date(Date.now() + 60 * 60 * 1000),
      status: SessionStatus.scheduled,
      durationMinutes: 60,
    });

    await inMemorySessionRepository.create(session);

    const result = await sut.handle({
      sessionId: session.id.toString(),
      price: 120,
      notes: 'Future in-progress not allowed',
      sessionDate: new Date(Date.now() + 2 * 60 * 60 * 1000),
      status: SessionStatus.inProgress,
      durationMinutes: 60,
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ErrorInvalidChronologicalStatus);
    }
  });
});
