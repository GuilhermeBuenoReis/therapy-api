import { beforeEach, describe, expect, it } from 'vitest';
import { InMemoryPaymentRepository } from '../../../test/repositories/in-memory-payment-repository';
import { MethodEnum, TypeEnum } from '../entities/payment';
import { CreatePaymentService } from './create-payment-service';

let sut: CreatePaymentService;
let inMemoryPaymentRepository: InMemoryPaymentRepository;

describe('Create Payment Service', () => {
  beforeEach(() => {
    inMemoryPaymentRepository = new InMemoryPaymentRepository();
    sut = new CreatePaymentService(inMemoryPaymentRepository);
  });

  it('should be able to create a payment', async () => {
    const result = await sut.handle({
      professionalId: 'professional-01',
      subscriptionId: 'subscription-01',
      type: TypeEnum.Subscription,
      amount: 100,
      paidAt: new Date('2024-07-22T09:15:48Z'),
      method: MethodEnum.Pix,
      notes: 'first payment',
    });

    expect(result.isRight()).toBe(true);
    expect(inMemoryPaymentRepository.items).toHaveLength(1);
    if (result.isRight()) {
      expect(result.value.payment.subscriptionId).toBe('subscription-01');
      expect(result.value.payment.amount).toBe(100);
    }
  });

  it('should create a payment even without subscription reference', async () => {
    const result = await sut.handle({
      professionalId: 'professional-01',
      type: TypeEnum.AddOn,
      amount: 120,
      paidAt: new Date('2024-08-10T15:45:12Z'),
      method: MethodEnum.Cash,
      notes: 'duplicate payment',
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.payment.subscriptionId).toBeNull();
      expect(result.value.payment.type).toBe(TypeEnum.AddOn);
    }
  });
});
