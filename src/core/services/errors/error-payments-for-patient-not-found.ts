export class ErrorPaymentsForPatientNotFound extends Error {
  constructor() {
    super('No payments found for this patient.');
    this.name = 'ErrorPaymentsForPatientNotFound';
  }
}
