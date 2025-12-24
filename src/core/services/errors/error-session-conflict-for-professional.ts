export class ErrorSessionConflictForProfessional extends Error {
  constructor() {
    super('Professional already has a session scheduled at this time.');
    this.name = 'ErrorSessionConflictForProfessional';
  }
}
