import { Session, SessionStatus } from '../entities/session';
import type { PatientRepository } from '../repositories/patient-repository';
import type { ProfessionalsRepository } from '../repositories/professionals-repository';
import type { SessionRepository } from '../repositories/session-repository';
import { type Either, left, right } from '../utils/either';
import { ErrorPatientNotLinkedToProfessional } from './errors/patient-not-linked-to-a-professional';
import { ErrorPatientNotFound } from './errors/patient-not-found';
import { ErrorSessionConflictForPatient } from './errors/error-session-conflict-for-patient';
import { ErrorSessionConflictForProfessional } from './errors/error-session-conflict-for-professional';
import { ProfessionalNotFoundError } from './errors/professional-not-found-error';
import type {
  SubscriptionAccessMiddleware,
  SubscriptionMiddlewareError,
} from './rules/check-subscription-status-middleware';

export interface CreateSessionServiceRequest {
  patientId: string;
  professionalId: string;
  sessionDate: Date;
  price?: number;
  notes?: string;
  durationMinutes?: number;
}

type CreateSessionServiceResponse = Either<
  | ErrorPatientNotFound
  | ErrorPatientNotLinkedToProfessional
  | ProfessionalNotFoundError
  | ErrorSessionConflictForProfessional
  | ErrorSessionConflictForPatient
  | SubscriptionMiddlewareError,
  { session: Session }
>;

export class CreateSessionService {
  constructor(
    private sessionRepository: SessionRepository,
    private patientRepository: PatientRepository,
    private professionalsRepository: ProfessionalsRepository,
    private subscriptionMiddleware: SubscriptionAccessMiddleware
  ) {}

  async handle({
    patientId,
    professionalId,
    sessionDate,
    price,
    notes,
    durationMinutes,
  }: CreateSessionServiceRequest): Promise<CreateSessionServiceResponse> {
    const patient = await this.patientRepository.findById(patientId);
    if (!patient) {
      return left(new ErrorPatientNotFound());
    }

    const professional = await this.professionalsRepository.findById(
      professionalId
    );
    if (!professional) {
      return left(new ProfessionalNotFoundError());
    }

    if (patient.professionalsId !== professionalId) {
      return left(new ErrorPatientNotLinkedToProfessional(professionalId));
    }

    const subscriptionResult = await this.subscriptionMiddleware.enforceAccess({
      professionalId,
      operation: 'write',
    });
    if (subscriptionResult.isLeft()) {
      return left(subscriptionResult.value);
    }

    const patientConflict = await this.sessionRepository.findByPatientAndDate(
      patientId,
      sessionDate
    );
    if (patientConflict) {
      return left(new ErrorSessionConflictForPatient());
    }

    const professionalConflict =
      await this.sessionRepository.findByProfessionalAndDate(
        professionalId,
        sessionDate
      );
    if (professionalConflict) {
      return left(new ErrorSessionConflictForProfessional());
    }

    const session = Session.create({
      patientId,
      professionalId,
      price: price ?? professional.pricePerSession,
      notes: notes ?? '',
      sessionDate,
      status: SessionStatus.scheduled,
      durationMinutes: durationMinutes ?? professional.sessionDuration,
    });

    await this.sessionRepository.create(session);

    return right({ session });
  }
}
