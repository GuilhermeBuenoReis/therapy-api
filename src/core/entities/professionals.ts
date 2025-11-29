import type { Optional } from '../types/optional';
import { Entity } from '../utils/entity';
import type { UniqueEntityID } from '../utils/unique-entity-id';

export interface ProfessionalsProps {
  userId: UniqueEntityID;
  specialty: string;
  registration_number: string;
  phone: string;
  biography: string;
  pricePerSession: number;
  monthlyPrice: number;
  sessionDuration: number;

  createdAt: Date;
  updatedAt?: Date | null;
}

export class Professionals extends Entity<ProfessionalsProps> {
  get userId() {
    return this.props.userId;
  }

  get specialty() {
    return this.props.specialty;
  }

  get registration_number() {
    return this.props.registration_number;
  }

  get phone() {
    return this.props.phone;
  }

  get biography() {
    return this.props.biography;
  }

  get pricePerSession() {
    return this.props.pricePerSession;
  }

  get monthlyPrice() {
    return this.props.monthlyPrice;
  }

  get sessionDuration() {
    return this.props.sessionDuration;
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

  set specialty(specialty: string) {
    this.props.specialty = specialty;
    this.touch();
  }

  set registration_number(registration_number: string) {
    this.props.registration_number = registration_number;
    this.touch();
  }

  set phone(phone: string) {
    this.props.phone = phone;
    this.touch();
  }

  set biography(biography: string) {
    this.props.biography = biography;
    this.touch();
  }

  set pricePerSession(pricePerSession: number) {
    this.props.pricePerSession = pricePerSession;
    this.touch();
  }

  set monthlyPrice(monthlyPrice: number) {
    this.props.monthlyPrice = monthlyPrice;
    this.touch();
  }

  set sessionDuration(sessionDuration: number) {
    this.props.sessionDuration = sessionDuration;
    this.touch();
  }

  static create(
    props: Optional<ProfessionalsProps, 'createdAt'>,
    id?: UniqueEntityID
  ) {
    const professionals = new Professionals(
      {
        ...props,
        createdAt: props.createdAt ?? new Date(),
      },
      id
    );

    return professionals;
  }
}
