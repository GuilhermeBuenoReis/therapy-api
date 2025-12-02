import { beforeEach, describe, expect, it } from 'vitest';
import { InMemoryPaymentRepository } from '../../../test/repositories/in-memory-payment-repository';
import { makePayment } from '../../../test/factories/make-payment';
import { UniqueEntityID } from '../utils/unique-entity-id';
import { ErrorPaymentNotFound } from './errors/error-payment-not-found';
import { FindPaymentByIdService } from './find-payment-by-id-service';

let sut: FindPaymentByIdService;
let inMemoryPaymentRepository: InMemoryPaymentRepository;

describe('Find Payment By Id Service', () => {
  beforeEach(() => {
    inMemoryPaymentRepository = new InMemoryPaymentRepository();
    sut = new FindPaymentByIdService(inMemoryPaymentRepository);
  });

  it('should be able to find a payment by id', async () => {
    const payment = makePayment({}, new UniqueEntityID('payment-01'));

    await inMemoryPaymentRepository.create(payment);

    const result = await sut.handle({
      paymentId: payment.id.toString(),
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.payment.id.toString()).toBe('payment-01');
    }
  });

  it('should return left when payment does not exist', async () => {
    const result = await sut.handle({
      paymentId: 'missing-id',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ErrorPaymentNotFound);
    }
  });
});
