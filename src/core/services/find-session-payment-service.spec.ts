import { beforeEach, describe, expect, it } from 'vitest';
import { InMemoryPaymentRepository } from '../../../test/repositories/in-memory-payment-repository';
import { makePayment } from '../../../test/factories/make-payment';
import { ErrorPaymentNotFound } from './errors/error-payment-not-found';
import { FindSessionPaymentService } from './find-session-payment-service';

let sut: FindSessionPaymentService;
let inMemoryPaymentRepository: InMemoryPaymentRepository;

describe('Find Session Payment Service', () => {
  beforeEach(() => {
    inMemoryPaymentRepository = new InMemoryPaymentRepository();
    sut = new FindSessionPaymentService(inMemoryPaymentRepository);
  });

  it('should be able to find a payment by session id', async () => {
    const payment = makePayment({
      professionalId: 'professional-01',
      patientId: 'patient-01',
      sessionId: 'session-01',
      amount: 120,
      paidAt: new Date('2024-07-05T13:40:00Z'),
    });

    await inMemoryPaymentRepository.create(payment);

    const result = await sut.handle({
      sessionId: 'session-01',
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.payment.sessionId).toBe('session-01');
    }
  });

  it('should return left when no payment for session', async () => {
    const result = await sut.handle({
      sessionId: 'missing-session',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ErrorPaymentNotFound);
    }
  });
});
