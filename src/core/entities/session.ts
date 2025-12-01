import type { Optional } from '../types/optional';
import { Entity } from '../utils/entity';
import type { UniqueEntityID } from '../utils/unique-entity-id';

export enum SessionStatus {
  scheduled,
  done,
  canceled,
}

type SessionProps = {
  patientId: string;
  professionalId: string;
  price: number;
  notes: string;
  sessionDate: Date;
  status: SessionStatus;
  durationMinutes: number;

  createdAt: Date;
  updatedAt?: Date | null;
};

export class Session extends Entity<SessionProps> {
  get patientId() {
    return this.props.patientId;
  }

  get professionalId() {
    return this.props.professionalId;
  }

  get price() {
    return this.props.price;
  }

  get notes() {
    return this.props.notes;
  }

  get sessionDate() {
    return this.props.sessionDate;
  }

  get status() {
    return this.props.status;
  }

  get durationMinutes() {
    return this.props.durationMinutes;
  }

  get createdAt() {
    return this.props.createdAt;
  }

  get updatedAt() {
    return this.props.updatedAt;
  }

  private touch() {
    this.props.updatedAt = new Date();
  }

  set price(price: number) {
    this.props.price = price;
    this.touch();
  }

  set notes(notes: string) {
    this.props.notes = notes;
    this.touch();
  }

  set sessionDate(sessionDate: Date) {
    this.props.sessionDate = sessionDate;
    this.touch();
  }

  set status(status: SessionStatus) {
    this.props.status = status;
    this.touch();
  }

  set durationMinutes(durationMinutes: number) {
    this.props.durationMinutes = durationMinutes;
    this.touch();
  }

  static create(
    props: Optional<SessionProps, 'createdAt'>,
    id?: UniqueEntityID
  ) {
    const session = new Session(
      {
        ...props,
        createdAt: props.createdAt ?? new Date(),
      },
      id
    );

    return session;
  }
}
