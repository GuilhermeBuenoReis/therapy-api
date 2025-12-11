import type { Optional } from '../types/optional';
import { Entity } from '../utils/entity';
import type { UniqueEntityID } from '../utils/unique-entity-id';

interface SubscriptionPaymentLogProps {
  subscriptionId: string;
  professionalId: string;
  amount: number;
  paidAt: Date;
  notes?: string | null;
  createdAt: Date;
}

export class SubscriptionPaymentLog extends Entity<SubscriptionPaymentLogProps> {
  get subscriptionId() {
    return this.props.subscriptionId;
  }

  get professionalId() {
    return this.props.professionalId;
  }

  get amount() {
    return this.props.amount;
  }

  get paidAt() {
    return this.props.paidAt;
  }

  get notes() {
    return this.props.notes;
  }

  get createdAt() {
    return this.props.createdAt;
  }

  static create(
    props: Optional<SubscriptionPaymentLogProps, 'createdAt' | 'notes'>,
    id?: UniqueEntityID
  ) {
    return new SubscriptionPaymentLog(
      {
        ...props,
        createdAt: props.createdAt ?? new Date(),
        notes: props.notes ?? null,
      },
      id
    );
  }
}
