export class ErrorSessionByPatientAlreadyExists extends Error {
  constructor() {
    super('This session is not linked to this patient.');
    this.name = 'ErrorSessionByPatientAlreadyExists';
  }
}
