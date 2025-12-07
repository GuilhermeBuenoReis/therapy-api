import type { Optional } from '../types/optional';
import { Entity } from '../utils/entity';
import type { UniqueEntityID } from '../utils/unique-entity-id';

export enum UserRole {
  Professional = 'professional',
  Patient = 'patient',
}

interface UserProps {
  name: string;
  email: string;
  password: string;
  role: UserRole
  createdAt: Date;
  updatedAt?: Date | null;
}

export class User extends Entity<UserProps> {
  get name() {
    return this.props.name;
  }
  get email() {
    return this.props.email;
  }

  get password() {
    return this.props.password;
  }

  get role() {
    return this.props.role;
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

  set email(email: string) {
    this.props.email = email;
    this.touch();
  }

  set password(password: string) {
    this.props.password = password;
    this.touch();
  }

  set role(role: UserRole) {
    this.props.role = role;
    this.touch();
  }

  static create(props: Optional<UserProps, 'createdAt' | 'role'>, id?: UniqueEntityID) {
    const user = new User(
      {
        ...props,
        role: props.role ?? UserRole.Professional,
        createdAt: props.createdAt ?? new Date(),
      },
      id
    );

    return user;
  }
}
