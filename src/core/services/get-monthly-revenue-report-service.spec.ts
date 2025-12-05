import { beforeEach, describe, expect, it } from 'vitest';
import { makeProfessionals } from '../../../test/factories/make-professionals';
import { makeSession } from '../../../test/factories/make-session';
import { InMemoryProfessionalsRepository } from '../../../test/repositories/in-memory-professionals-repository';
import { InMemorySessionRepository } from '../../../test/repositories/in-memory-session-repository';
import { SessionStatus } from '../entities/session';
import { UniqueEntityID } from '../utils/unique-entity-id';
import { ErrorProfessionalsNotFound } from './errors/professionals-not-found';
import { GetMonthlyRevenueReportService } from './get-monthly-revenue-report-service';

let sut: GetMonthlyRevenueReportService;
let inMemorySessionRepository: InMemorySessionRepository;
let inMemoryProfessionalsRepository: InMemoryProfessionalsRepository;

describe('Get Monthly Revenue Report Service', () => {
  beforeEach(() => {
    inMemorySessionRepository = new InMemorySessionRepository();
    inMemoryProfessionalsRepository = new InMemoryProfessionalsRepository();
    sut = new GetMonthlyRevenueReportService(
      inMemorySessionRepository,
      inMemoryProfessionalsRepository
    );
  });

  it('should return monthly revenue summary for professional', async () => {
    const professional = makeProfessionals(
      {},
      new UniqueEntityID('professional-01')
    );

    await inMemoryProfessionalsRepository.create(professional);

    const completedSessionA = makeSession({
      professionalId: professional.id.toString(),
      patientId: 'patient-01',
      status: SessionStatus.completed,
      price: 120,
      sessionDate: new Date('2024-05-05T10:00:00Z'),
    });

    const completedSessionB = makeSession({
      professionalId: professional.id.toString(),
      patientId: 'patient-01',
      status: SessionStatus.completed,
      price: 180,
      sessionDate: new Date('2024-05-10T12:00:00Z'),
    });

    const canceledSession = makeSession({
      professionalId: professional.id.toString(),
      patientId: 'patient-02',
      status: SessionStatus.canceled,
      price: 90,
      sessionDate: new Date('2024-05-15T09:00:00Z'),
    });

    const otherMonthSession = makeSession({
      professionalId: professional.id.toString(),
      patientId: 'patient-03',
      status: SessionStatus.completed,
      price: 999,
      sessionDate: new Date('2024-06-01T08:00:00Z'),
    });

    const otherProfessionalSession = makeSession({
      professionalId: 'another-professional',
      patientId: 'patient-04',
      status: SessionStatus.completed,
      price: 200,
      sessionDate: new Date('2024-05-20T14:00:00Z'),
    });

    await inMemorySessionRepository.create(completedSessionA);
    await inMemorySessionRepository.create(completedSessionB);
    await inMemorySessionRepository.create(canceledSession);
    await inMemorySessionRepository.create(otherMonthSession);
    await inMemorySessionRepository.create(otherProfessionalSession);

    const result = await sut.handle({
      professionalId: professional.id.toString(),
      month: 5,
      year: 2024,
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      const { monthlyRevenueSummary } = result.value;
      expect(monthlyRevenueSummary.totalRevenue).toBe(300);
      expect(monthlyRevenueSummary.totalSessions).toBe(3);
      expect(monthlyRevenueSummary.totalCompletedSessions).toBe(2);
      expect(monthlyRevenueSummary.totalCanceledSessions).toBe(1);
      expect(monthlyRevenueSummary.uniquePatients).toBe(1);
    }
  });

  it('should return error when professional does not exist', async () => {
    const result = await sut.handle({
      professionalId: 'non-existent-professional',
      month: 5,
      year: 2024,
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ErrorProfessionalsNotFound);
    }
  });
});
