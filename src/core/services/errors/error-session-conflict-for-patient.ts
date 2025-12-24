export class ErrorSessionConflictForPatient extends Error {
  constructor() {
    super('Patient already has a session scheduled at this time.');
    this.name = 'ErrorSessionConflictForPatient';
  }
}
