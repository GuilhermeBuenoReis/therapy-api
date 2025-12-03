import { beforeEach, describe, expect, it } from 'vitest';
import { InMemorySessionRepository } from '../../../test/repositories/in-memory-session-repository';
import { InMemoryPatientRepository } from '../../../test/repositories/in-memory-patient-repository';
import { makePatient } from '../../../test/factories/make-patient';
import { Session, SessionStatus } from '../entities/session';
import { UniqueEntityID } from '../utils/unique-entity-id';
import { ErrorPatientNotFound } from './errors/patient-not-found';
import { ErrorPatientNotLinkedToProfessional } from './errors/patient-not-linked-to-a-professional';
import { ErrorSessionNotFound } from './errors/session-not-found-error';
import { FindSessionByPatientIdService } from './find-session-by-patient-id-service';
import { VerifyProfessionalHasAccessToPatient } from './rules/verify-professional-has-access-to-patient';

let sut: FindSessionByPatientIdService;
let inMemorySessionRepository: InMemorySessionRepository;
let inMemoryPatientRepository: InMemoryPatientRepository;

describe('Find Session By Patient Id Service', () => {
  beforeEach(() => {
    inMemorySessionRepository = new InMemorySessionRepository();
    inMemoryPatientRepository = new InMemoryPatientRepository();
    const verifier = new VerifyProfessionalHasAccessToPatient(
      inMemoryPatientRepository
    );
    sut = new FindSessionByPatientIdService(
      inMemorySessionRepository,
      verifier
    );
  });

  it('should be able to find a session by patient id', async () => {
    const patient = makePatient({ professionalsId: 'professional-01' });
    await inMemoryPatientRepository.create(patient);

    const session = Session.create(
      {
        patientId: patient.id.toString(),
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
      patientId: patient.id.toString(),
      professionalId: 'professional-01',
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.session.patientId).toBe(patient.id.toString());
    }
  });

  it('should return error when patient does not exist', async () => {
    const result = await sut.handle({
      patientId: 'missing-patient',
      professionalId: 'professional-01',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ErrorPatientNotFound);
    }
  });

  it('should return error when patient is not linked to professional', async () => {
    const patient = makePatient({ professionalsId: 'another-professional' });
    await inMemoryPatientRepository.create(patient);

    const result = await sut.handle({
      patientId: patient.id.toString(),
      professionalId: 'professional-01',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(
        ErrorPatientNotLinkedToProfessional
      );
    }
  });

  it('should return left when session does not exist', async () => {
    const patient = makePatient({ professionalsId: 'professional-01' });
    await inMemoryPatientRepository.create(patient);

    const result = await sut.handle({
      patientId: patient.id.toString(),
      professionalId: 'professional-01',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ErrorSessionNotFound);
    }
  });
});
