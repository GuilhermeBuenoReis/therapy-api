import type { Optional } from '../types/optional';
import { Entity } from '../utils/entity';
import type { UniqueEntityID } from '../utils/unique-entity-id';

export enum TypeEnum {
  Subscription = 'subscription',
  AddOn = 'add-on',
  Other = 'other',
}

export enum MethodEnum {
  Pix = 'pix',
  Cash = 'cash',
  Credit = 'credit',
  Debit = 'debit',
}

interface PaymentProps {
  professionalId: string;
  subscriptionId?: string | null;
  type: TypeEnum;
  amount: number;
  paidAt: Date;
  method: MethodEnum;
  notes?: string | null;
  createdAt: Date;
}

export class Payment extends Entity<PaymentProps> {
  get professionalId() {
    return this.props.professionalId;
  }

  get subscriptionId() {
    return this.props.subscriptionId ?? null;
  }

  get type() {
    return this.props.type;
  }

  get amount() {
    return this.props.amount;
  }

  get paidAt() {
    return this.props.paidAt;
  }

  get method() {
    return this.props.method;
  }

  get notes() {
    return this.props.notes;
  }

  get createdAt() {
    return this.props.createdAt;
  }

  set subscriptionId(subscriptionId: string | null | undefined) {
    this.props.subscriptionId = subscriptionId ?? null;
  }

  set type(type: TypeEnum) {
    this.props.type = type;
  }

  set amount(amount: number) {
    this.props.amount = amount;
  }

  set paidAt(paidAt: Date) {
    this.props.paidAt = paidAt;
  }

  set method(method: MethodEnum) {
    this.props.method = method;
  }

  set notes(notes: string | null | undefined) {
    this.props.notes = notes ?? null;
  }

  static create(
    props: Optional<PaymentProps, 'createdAt' | 'subscriptionId'>,
    id?: UniqueEntityID
  ) {
    const payment = new Payment(
      {
        ...props,
        createdAt: props.createdAt ?? new Date(),
        subscriptionId: props.subscriptionId ?? null,
        notes: props.notes ?? null,
      },
      id
    );

    return payment;
  }
}
