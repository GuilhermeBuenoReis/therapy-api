import { beforeEach, describe, expect, it } from 'vitest';
import { InMemorySessionRepository } from '../../../test/repositories/in-memory-session-repository';
import { InMemoryPatientRepository } from '../../../test/repositories/in-memory-patient-repository';
import { SessionStatus } from '../entities/session';
import { makePatient } from '../../../test/factories/make-patient';
import { CreateSessionService } from './create-session-service';
import { ErrorPatientNotFound } from './errors/patient-not-found';
import { ErrorPatientNotLinkedToProfessional } from './errors/patient-not-linked-to-a-professional';
import { ErrorSessionConflict } from './errors/error-session-conflict';

let sut: CreateSessionService;
let inMemorySessionRepository: InMemorySessionRepository;
let inMemoryPatientRepository: InMemoryPatientRepository;

describe('Create Session Service', () => {
  beforeEach(() => {
    inMemorySessionRepository = new InMemorySessionRepository();
    inMemoryPatientRepository = new InMemoryPatientRepository();
    sut = new CreateSessionService(
      inMemorySessionRepository,
      inMemoryPatientRepository
    );
  });

  it('should be able to create a session', async () => {
    const patient = makePatient({ professionalsId: 'professional-01' });
    await inMemoryPatientRepository.create(patient);

    const result = await sut.handle({
      patientId: patient.id.toString(),
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
      expect(session.patientId).toBe(patient.id.toString());
      expect(session.professionalId).toBe('professional-01');
      expect(session.price).toBe(100);
      expect(session.status).toBe(SessionStatus.scheduled);
    }
  });

  it('should return error when patient does not exist', async () => {
    const result = await sut.handle({
      patientId: 'non-existent-patient',
      professionalId: 'professional-01',
      price: 100,
      notes: 'First session',
      sessionDate: new Date('2024-01-01T10:00:00Z'),
      status: SessionStatus.scheduled,
      durationMinutes: 60,
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ErrorPatientNotFound);
    }
  });

  it('should return error when patient does not belong to professional', async () => {
    const patient = makePatient({ professionalsId: 'professional-02' });
    await inMemoryPatientRepository.create(patient);

    const result = await sut.handle({
      patientId: patient.id.toString(),
      professionalId: 'professional-01',
      price: 150,
      notes: 'Conflicting session',
      sessionDate: new Date('2024-01-02T10:00:00Z'),
      status: SessionStatus.scheduled,
      durationMinutes: 45,
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(
        ErrorPatientNotLinkedToProfessional
      );
    }
  });

  it('should return error when patient has a time conflict', async () => {
    const patient = makePatient({ professionalsId: 'professional-01' });
    await inMemoryPatientRepository.create(patient);

    await sut.handle({
      patientId: patient.id.toString(),
      professionalId: 'professional-01',
      price: 100,
      notes: 'First session',
      sessionDate: new Date('2024-01-01T10:00:00Z'),
      status: SessionStatus.scheduled,
      durationMinutes: 60,
    });

    const result = await sut.handle({
      patientId: patient.id.toString(),
      professionalId: 'professional-01',
      price: 120,
      notes: 'Conflicting session',
      sessionDate: new Date('2024-01-01T10:00:00Z'),
      status: SessionStatus.scheduled,
      durationMinutes: 45,
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ErrorSessionConflict);
    }
  });
});
