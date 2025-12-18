import type { Patient } from '../entities/patient';
import type { PatientRepository } from '../repositories/patient-repository';
import type { ProfessionalsRepository } from '../repositories/professionals-repository';
import { type Either, left, right } from '../utils/either';
import { ProfessionalNotFoundError } from './errors/professional-not-found-error';

export interface ListPatientsByProfessionalServiceRequest {
  professionalId: string;
}

type ListPatientsByProfessionalServiceResponse = Either<
  ProfessionalNotFoundError,
  { patient: Patient[] }
>;

export class ListPatientsByProfessionalService {
  constructor(
    private professionalRepository: ProfessionalsRepository,
    private patientRepository: PatientRepository
  ) {}

  async handle({
    professionalId,
  }: ListPatientsByProfessionalServiceRequest): Promise<ListPatientsByProfessionalServiceResponse> {
    const professional =
      await this.professionalRepository.findById(professionalId);

    if (!professional) {
      return left(new ProfessionalNotFoundError());
    }

    const patient =
      await this.patientRepository.findManyByProfessional(professionalId);

    return right({
      patient,
    });
  }
}
