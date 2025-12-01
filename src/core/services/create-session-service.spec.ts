import { beforeEach, describe, expect, it } from 'vitest';
import { InMemorySessionRepository } from '../../../test/repositories/in-memory-session-repository';
import { SessionStatus } from '../entities/session';
import { CreateSessionService } from './create-session-service';
import { ErrorSessionByPatientAlreadyExists } from './errors/session-by-patient-already-exist-error';
import { ErrorSessionByProfessionalAlreadyExists } from './errors/session-by-professional-already-exist-error';

let sut: CreateSessionService;
let inMemorySessionRepository: InMemorySessionRepository;

describe('Create Session Service', () => {
  beforeEach(() => {
    inMemorySessionRepository = new InMemorySessionRepository();
    sut = new CreateSessionService(inMemorySessionRepository);
  });

  it('should be able to create a session', async () => {
    const result = await sut.handle({
      patientId: 'patient-01',
      professionalId: 'professional-01',
      price: 100,
      notes: 'First session',
      sessionDate: new Date('2024-01-01T10:00:00Z'),
      status: SessionStatus.scheduled,
      durationMinutes: 60,
    });

    expect(result.isRight()).toBe(true);
    expect(inMemorySessionRepository.items).toHaveLength(1);
    if (result.isRight()) {
      const { session } = result.value;
      expect(session.patientId).toBe('patient-01');
      expect(session.professionalId).toBe('professional-01');
      expect(session.price).toBe(100);
      expect(session.status).toBe(SessionStatus.scheduled);
    }
  });

  it('should not allow creating a duplicate session for the same patient or professional', async () => {
    await sut.handle({
      patientId: 'patient-01',
      professionalId: 'professional-01',
      price: 100,
      notes: 'First session',
      sessionDate: new Date('2024-01-01T10:00:00Z'),
      status: SessionStatus.scheduled,
      durationMinutes: 60,
    });

    const result = await sut.handle({
      patientId: 'patient-01',
      professionalId: 'professional-02',
      price: 150,
      notes: 'Conflicting session',
      sessionDate: new Date('2024-01-02T10:00:00Z'),
      status: SessionStatus.scheduled,
      durationMinutes: 45,
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      const isPatientError =
        result.value instanceof ErrorSessionByPatientAlreadyExists;
      const isProfessionalError =
        result.value instanceof ErrorSessionByProfessionalAlreadyExists;
      expect(isPatientError || isProfessionalError).toBe(true);
    }
  });
});
