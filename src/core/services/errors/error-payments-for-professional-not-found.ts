export class ErrorPaymentsForProfessionalNotFound extends Error {
  constructor() {
    super('No payments found for this professional.');
    this.name = 'ErrorPaymentsForProfessionalNotFound';
  }
}
