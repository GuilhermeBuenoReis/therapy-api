import type { Optional } from '../types/optional';
import { Entity } from '../utils/entity';
import type { UniqueEntityID } from '../utils/unique-entity-id';

export enum SubscriptionStatus {
  Active = 'active',
  Expired = 'expired',
  Canceled = 'canceled',
  Pending = 'pending',
}

interface SubscriptionProps {
  professionalId: string;
  monthPrice: number;
  status: SubscriptionStatus;
  startDate: Date;
  endDate: Date;
  createdAt: Date;
  updatedAt?: Date | null;
}

export class Subscription extends Entity<SubscriptionProps> {
  get professionalId() {
    return this.props.professionalId;
  }

  get price() {
    return this.props.monthPrice;
  }

  get status() {
    return this.props.status;
  }

  get startDate() {
    return this.props.startDate;
  }

  get endDate() {
    return this.props.endDate;
  }

  set status(status: SubscriptionStatus) {
    this.props.status = status;
    this.touch();
  }

  private touch() {
    this.props.updatedAt = new Date();
  }

  static create(
    props: Optional<SubscriptionProps, 'createdAt' | 'updatedAt'>,
    id?: UniqueEntityID
  ) {
    return new Subscription(
      {
        ...props,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? null,
      },
      id
    );
  }
}
