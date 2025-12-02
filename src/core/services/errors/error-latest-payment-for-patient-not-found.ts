export class ErrorLatestPaymentForPatientNotFound extends Error {
  constructor() {
    super('No latest payment found for this patient.');
    this.name = 'ErrorLatestPaymentForPatientNotFound';
  }
}
