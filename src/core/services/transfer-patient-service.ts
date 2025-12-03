import { PatientTransferHistory } from '../entities/patient-transfer-history';
import type { PatientRepository } from '../repositories/patient-repository';
import type { PatientTransferHistoryRepository } from '../repositories/patient-transfer-history-repository';
import type { ProfessionalsRepository } from '../repositories/professionals-repository';
import { type Either, left, right } from '../utils/either';
import { UniqueEntityID } from '../utils/unique-entity-id';
import { ErrorPatientNotFound } from './errors/patient-not-found';
import { ErrorPatientNotLinkedToProfessional } from './errors/patient-not-linked-to-a-professional';
import { ErrorProfessionalsNotFound } from './errors/professionals-not-found';

export interface TransferPatientServiceRequest {
  patientId: string;
  originProfessionalId: string;
  destinationProfessionalId: string;
  reason: string;
}

type TransferPatientServiceResponse = Either<
  | ErrorProfessionalsNotFound
  | ErrorPatientNotFound
  | ErrorPatientNotLinkedToProfessional,
  {}
>;

export class TransferPatientService {
  constructor(
    private patientRepository: PatientRepository,
    private professionalsRepository: ProfessionalsRepository,
    private PatientTransferHistoryRepository: PatientTransferHistoryRepository
  ) {}

  async handle({
    patientId,
    originProfessionalId,
    destinationProfessionalId,
    reason,
  }: TransferPatientServiceRequest): Promise<TransferPatientServiceResponse> {
    const patient = await this.patientRepository.findById(patientId);

    if (!patient) {
      return left(new ErrorPatientNotFound());
    }

    const professionalWhoIsReleasingPatient =
      await this.professionalsRepository.findById(originProfessionalId);

    if (!professionalWhoIsReleasingPatient) {
      return left(new ErrorProfessionalsNotFound());
    }

    const professionalWhoIsReceivingPatient =
      await this.professionalsRepository.findById(destinationProfessionalId);

    if (!professionalWhoIsReceivingPatient) {
      return left(new ErrorProfessionalsNotFound());
    }

    if (patient.professionalsId !== originProfessionalId) {
      return left(
        new ErrorPatientNotLinkedToProfessional(originProfessionalId)
      );
    }

    const transfer = PatientTransferHistory.create(
      {
        patientId,
        originProfessional: originProfessionalId,
        destinationProfessional: destinationProfessionalId,
        reason,
      },
      new UniqueEntityID()
    );

    await this.PatientTransferHistoryRepository.create(transfer);

    patient.professionalsId = destinationProfessionalId;
    await this.patientRepository.save(patient);

    return right({});
  }
}
