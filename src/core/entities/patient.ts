import type { Optional } from '../types/optional';
import { Entity } from '../utils/entity';
import type { UniqueEntityID } from '../utils/unique-entity-id';

type PatientProps = {
  userId: string;
  professionalsId: string;
  name: string;
  birthDate: string;
  phone: string;
  note: string;

  createdAt: Date;
  updatedAt?: Date | null;
};

export class Patient extends Entity<PatientProps> {
  get userId() {
    return this.props.userId;
  }

  get professionalsId() {
    return this.props.professionalsId;
  }

  get name() {
    return this.props.name;
  }

  get birthDate() {
    return this.props.birthDate;
  }

  get phone() {
    return this.props.phone;
  }

  get note() {
    return this.props.note;
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

  set name(name: string) {
    this.props.name = name;
    this.touch();
  }

  set birthDate(birthDate: string) {
    this.props.birthDate = birthDate;
    this.touch();
  }

  set phone(phone: string) {
    this.props.phone = phone;
    this.touch();
  }

  set note(note: string) {
    this.props.note = note;
    this.touch();
  }

  static create(
    props: Optional<PatientProps, 'createdAt'>,
    id?: UniqueEntityID
  ) {
    const patient = new Patient(
      {
        ...props,
        createdAt: props.createdAt ?? new Date(),
      },
      id
    );

    return patient;
  }
}
