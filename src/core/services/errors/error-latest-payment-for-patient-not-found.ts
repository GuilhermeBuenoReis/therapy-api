export class ErrorLatestPaymentForProfessionalNotFound extends Error {
  constructor() {
    super('No latest payment found for this professional.');
    this.name = 'ErrorLatestPaymentForProfessionalNotFound';
  }
}
