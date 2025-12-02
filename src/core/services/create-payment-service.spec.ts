import { beforeEach, describe, expect, it } from 'vitest';
import { InMemoryPaymentRepository } from '../../../test/repositories/in-memory-payment-repository';
import { MethodEnum, TypeEnum } from '../entities/payment';
import { CreatePaymentService } from './create-payment-service';
import { ErrorPaymentSessionAlreadyExists } from './errors/error-payment-session-already-exists';

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
      patientId: 'patient-01',
      sessionId: 'session-01',
      type: TypeEnum.session,
      amount: 100,
      paidAt: new Date('2024-07-22T09:15:48Z'),
      method: MethodEnum.pix,
      notes: 'first payment',
    });

    expect(result.isRight()).toBe(true);
    expect(inMemoryPaymentRepository.items).toHaveLength(1);
    if (result.isRight()) {
      expect(result.value.payment.sessionId).toBe('session-01');
      expect(result.value.payment.amount).toBe(100);
    }
  });

  it('should not allow duplicate payment for the same session', async () => {
    await sut.handle({
      professionalId: 'professional-01',
      patientId: 'patient-01',
      sessionId: 'session-01',
      type: TypeEnum.session,
      amount: 100,
      paidAt: new Date('2024-07-22T09:15:48Z'),
      method: MethodEnum.pix,
      notes: 'first payment',
    });

    const result = await sut.handle({
      professionalId: 'professional-01',
      patientId: 'patient-01',
      sessionId: 'session-01',
      type: TypeEnum.session,
      amount: 120,
      paidAt: new Date('2024-08-10T15:45:12Z'),
      method: MethodEnum.cash,
      notes: 'duplicate payment',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ErrorPaymentSessionAlreadyExists);
    }
  });
});
