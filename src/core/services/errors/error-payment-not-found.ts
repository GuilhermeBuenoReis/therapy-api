export class ErrorPaymentNotFound extends Error {
  constructor() {
    super('Payment not found.');
    this.name = 'ErrorPaymentNotFound';
  }
}
