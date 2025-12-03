import type { Patient } from '../entities/patient';
import type { PatientRepository } from '../repositories/patient-repository';
import type { ProfessionalsRepository } from '../repositories/professionals-repository';
import { type Either, left, right } from '../utils/either';
import { ErrorProfessionalsNotFound } from './errors/professionals-not-found';

export interface GetPatientByProfessionalsServiceRequest {
  professionalId: string;
}

type GetPatientByProfessionalsServiceResponse = Either<
  ErrorProfessionalsNotFound,
  { patient: Patient[] }
>;

export class GetPatientByProfessionalsService {
  constructor(
    private professionalRepository: ProfessionalsRepository,
    private patientRepository: PatientRepository
  ) {}

  async handle({
    professionalId,
  }: GetPatientByProfessionalsServiceRequest): Promise<GetPatientByProfessionalsServiceResponse> {
    const professional =
      await this.professionalRepository.findById(professionalId);

    if (!professional) {
      return left(new ErrorProfessionalsNotFound());
    }

    const patient =
      await this.patientRepository.findManyByProfessional(professionalId);

    return right({
      patient,
    });
  }
}
