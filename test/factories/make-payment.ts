import { faker } from '@faker-js/faker';
import { MethodEnum, Payment, TypeEnum } from '../../src/core/entities/payment';
import { UniqueEntityID } from '../../src/core/utils/unique-entity-id';

type PaymentOverride = Partial<{
  professionalId: string;
  subscriptionId: string | null;
  type: TypeEnum;
  amount: number;
  paidAt: Date;
  method: MethodEnum;
  notes: string | null;
  createdAt: Date;
}>;

export function makePayment(
  override: PaymentOverride = {},
  id?: UniqueEntityID
) {
  const payment = Payment.create(
    {
      professionalId: override.professionalId ?? new UniqueEntityID().toString(),
      subscriptionId:
        override.subscriptionId ?? new UniqueEntityID().toString(),
      type: override.type ?? TypeEnum.Subscription,
      amount: override.amount ?? faker.number.int({ min: 80, max: 400 }),
      paidAt: override.paidAt ?? faker.date.recent(),
      method: override.method ?? MethodEnum.Pix,
      notes: override.notes ?? faker.lorem.sentence(),
      createdAt: override.createdAt,
    },
    id
  );

  return payment;
}
