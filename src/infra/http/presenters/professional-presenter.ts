import type { Professionals } from '@/core/entities/professionals';

export class ProfessionalPresenter {
  static toHTTP(professional: Professionals) {
    return {
      id: professional.id.toString(),
      userId: professional.userId.toString(),
      specialty: professional.specialty,
      registrationNumber: professional.registration_number,
      phone: professional.phone,
      biography: professional.biography,
      pricePerSession: professional.pricePerSession,
      monthlyPrice: professional.monthlyPrice,
      sessionDuration: professional.sessionDuration,
      createdAt: professional.createdAt.toISOString(),
      updatedAt: professional.updatedAt?.toISOString() ?? null,
    };
  }
}
