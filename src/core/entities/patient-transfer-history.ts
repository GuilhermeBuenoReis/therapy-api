import type { UniqueEntityID } from '../utils/unique-entity-id';

interface PatientTransferHistoryProps {
  patientId: string;
  originProfessional: string;
  destinationProfessional: string;
  reason?: string;
  createdAt: Date;
}

export class PatientTransferHistory {
  private constructor(
    private props: PatientTransferHistoryProps,
    private _id?: UniqueEntityID
  ) {}

  get id() {
    return this._id;
  }

  get patientId() {
    return this.props.patientId;
  }

  get originProfessional() {
    return this.props.originProfessional;
  }

  get destinationProfessional() {
    return this.props.destinationProfessional;
  }

  get reason() {
    return this.props.reason;
  }

  get createdAt() {
    return this.props.createdAt;
  }

  static create(
    props: Omit<PatientTransferHistoryProps, 'createdAt'>,
    id?: UniqueEntityID
  ) {
    return new PatientTransferHistory({ ...props, createdAt: new Date() }, id);
  }
}
