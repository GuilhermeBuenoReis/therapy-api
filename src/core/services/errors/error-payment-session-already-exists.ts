export class ErrorPaymentSessionAlreadyExists extends Error {
  constructor() {
    super('Payment already exists for this session.');
    this.name = 'ErrorPaymentSessionAlreadyExists';
  }
}
