export class PatientNotFound extends Error {
  constructor() {
    super('Patient not found.');
    this.name = 'PatientNotFound';
  }
}
