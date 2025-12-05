import type { ProfessionalsRepository } from '../repositories/professionals-repository';
import type { SessionRepository } from '../repositories/session-repository';
import { type Either, left, right } from '../utils/either';
import { ErrorProfessionalsNotFound } from './errors/professionals-not-found';

export interface GetMonthlyRevenueReportServiceRequest {
  professionalId: string;
  month: number;
  year: number;
}

export interface MonthlyRevenueReport {
  totalRevenue: number;
  totalSessions: number;
  totalCompletedSessions: number;
  totalCanceledSessions: number;
  uniquePatients: number;
}

type GetMonthlyRevenueReportServiceResponse = Either<
  ErrorProfessionalsNotFound,
  { monthlyRevenueSummary: MonthlyRevenueReport }
>;

export class GetMonthlyRevenueReportService {
  constructor(
    private sessionRepository: SessionRepository,
    private professionalsRepository: ProfessionalsRepository
  ) {}

  async handle({
    professionalId,
    month,
    year,
  }: GetMonthlyRevenueReportServiceRequest): Promise<GetMonthlyRevenueReportServiceResponse> {
    const professional =
      await this.professionalsRepository.findById(professionalId);

    if (!professional) {
      return left(new ErrorProfessionalsNotFound());
    }

    const sessions =
      await this.sessionRepository.findManyByProfessionalAndMonth(
        professionalId,
        month,
        year
      );

    let totalRevenue = 0;
    const totalSessions = sessions.length;

    const completed = sessions.filter(
      session => session.status === 'completed'
    );

    const canceled = sessions.filter(session => session.status === 'canceled');

    totalRevenue = completed.reduce((sum, session) => sum + session.price, 0);

    const uniquePatients = new Set(completed.map(session => session.patientId))
      .size;

    const monthlyRevenueSummary: MonthlyRevenueReport = {
      totalRevenue,
      totalSessions,
      totalCompletedSessions: completed.length,
      totalCanceledSessions: canceled.length,
      uniquePatients,
    };

    return right({
      monthlyRevenueSummary,
    });
  }
}
