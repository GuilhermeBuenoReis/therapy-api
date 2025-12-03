import type { PatientTransferHistory } from '../../src/core/entities/patient-transfer-history';
import type { PatientTransferHistoryRepository } from '../../src/core/repositories/patient-transfer-history-repository';

export class InMemoryPatientTransferHistoryRepository
  implements PatientTransferHistoryRepository
{
  public items: PatientTransferHistory[] = [];

  async create(history: PatientTransferHistory): Promise<void> {
    this.items.push(history);
  }

  async findManyByPatient(patientId: string): Promise<PatientTransferHistory[]> {
    return this.items.filter(history => history.patientId === patientId);
  }
}
