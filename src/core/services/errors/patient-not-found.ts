export class ErrorPatientNotFound extends Error {
  constructor() {
    super('Patient not found.');
    this.name = 'ErrorPatientNotFound';
  }
}
