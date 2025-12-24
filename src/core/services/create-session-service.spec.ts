import { describe, expect, it, beforeEach } from 'vitest';
import { makePatient } from '../../../test/factories/make-patient';
import { makeProfessionals } from '../../../test/factories/make-professionals';
import { makeSession } from '../../../test/factories/make-session';
import { FakeCheckSubscriptionStatusMiddleware } from '../../../test/factories/fake-check-subscription-status-middleware';
import { InMemoryPatientRepository } from '../../../test/repositories/in-memory-patient-repository';
import { InMemoryProfessionalsRepository } from '../../../test/repositories/in-memory-professionals-repository';
import { InMemorySessionRepository } from '../../../test/repositories/in-memory-session-repository';
import { CreateSessionService } from './create-session-service';
import { ErrorPatientNotLinkedToProfessional } from './errors/patient-not-linked-to-a-professional';
import { ErrorPatientNotFound } from './errors/patient-not-found';
import { ErrorSessionConflictForPatient } from './errors/error-session-conflict-for-patient';
import { ErrorSessionConflictForProfessional } from './errors/error-session-conflict-for-professional';
import { ProfessionalNotFoundError } from './errors/professional-not-found-error';

let sessionRepository: InMemorySessionRepository;
let patientRepository: InMemoryPatientRepository;
let professionalsRepository: InMemoryProfessionalsRepository;
let subscriptionMiddleware: FakeCheckSubscriptionStatusMiddleware;
let sut: CreateSessionService;

describe('Create Session Service', () => {
  beforeEach(() => {
    sessionRepository = new InMemorySessionRepository();
    patientRepository = new InMemoryPatientRepository();
    professionalsRepository = new InMemoryProfessionalsRepository();
    subscriptionMiddleware = new FakeCheckSubscriptionStatusMiddleware();
    sut = new CreateSessionService(
      sessionRepository,
      patientRepository,
      professionalsRepository,
      subscriptionMiddleware
    );
  });

  it('should create a session for a patient', async () => {
    const professional = makeProfessionals();
    const patient = makePatient({
      professionalsId: professional.id.toString(),
    });

    professionalsRepository.items.push(professional);
    patientRepository.items.push(patient);

    const sessionDate = new Date('2024-01-02T10:00:00.000Z');

    const result = await sut.handle({
      patientId: patient.id.toString(),
      professionalId: professional.id.toString(),
      sessionDate,
    });

    expect(result.isRight()).toBe(true);
    expect(sessionRepository.items).toHaveLength(1);
    expect(result.value.session.price).toBe(professional.pricePerSession);
    expect(result.value.session.durationMinutes).toBe(
      professional.sessionDuration
    );
    expect(result.value.session.sessionDate).toEqual(sessionDate);
  });

  it('should not create a session when patient is not found', async () => {
    const professional = makeProfessionals();
    professionalsRepository.items.push(professional);

    const result = await sut.handle({
      patientId: 'non-existent',
      professionalId: professional.id.toString(),
      sessionDate: new Date(),
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(ErrorPatientNotFound);
  });

  it('should not create a session when patient does not belong to the professional', async () => {
    const professional = makeProfessionals();
    const otherProfessional = makeProfessionals();
    const patient = makePatient({
      professionalsId: otherProfessional.id.toString(),
    });

    professionalsRepository.items.push(professional, otherProfessional);
    patientRepository.items.push(patient);

    const result = await sut.handle({
      patientId: patient.id.toString(),
      professionalId: professional.id.toString(),
      sessionDate: new Date(),
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(ErrorPatientNotLinkedToProfessional);
  });

  it('should not create a session when professional is not found', async () => {
    const patient = makePatient();
    patientRepository.items.push(patient);

    const result = await sut.handle({
      patientId: patient.id.toString(),
      professionalId: 'missing',
      sessionDate: new Date(),
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(ProfessionalNotFoundError);
  });

  it('should not create a session when professional has a conflict at the same time', async () => {
    const professional = makeProfessionals();
    const patient = makePatient({
      professionalsId: professional.id.toString(),
    });

    professionalsRepository.items.push(professional);
    patientRepository.items.push(patient);

    const sessionDate = new Date('2024-01-02T15:00:00.000Z');
    sessionRepository.items.push(
      makeSession({
        professionalId: professional.id.toString(),
        patientId: patient.id.toString(),
        sessionDate,
      })
    );

    const result = await sut.handle({
      patientId: patient.id.toString(),
      professionalId: professional.id.toString(),
      sessionDate,
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(ErrorSessionConflictForProfessional);
  });

  it('should not create a session when patient has a conflict at the same time', async () => {
    const professional = makeProfessionals();
    const patient = makePatient({
      professionalsId: professional.id.toString(),
    });

    professionalsRepository.items.push(professional);
    patientRepository.items.push(patient);

    const sessionDate = new Date('2024-03-05T10:30:00.000Z');
    sessionRepository.items.push(
      makeSession({
        professionalId: professional.id.toString(),
        patientId: patient.id.toString(),
        sessionDate,
      })
    );

    const result = await sut.handle({
      patientId: patient.id.toString(),
      professionalId: professional.id.toString(),
      sessionDate,
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(ErrorSessionConflictForPatient);
  });
});
