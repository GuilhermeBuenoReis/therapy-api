import type { PatientTransferHistory } from '../entities/patient-transfer-history';

export interface PatientTransferHistoryRepository {
  create(history: PatientTransferHistory): Promise<void>;
  findManyByPatient(patientId: string): Promise<PatientTransferHistory[]>;
}
