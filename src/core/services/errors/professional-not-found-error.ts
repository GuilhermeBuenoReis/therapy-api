export class ProfessionalNotFoundError extends Error {
  constructor() {
    super('Professional not found.');
    this.name = 'ProfessionalNotFoundError';
  }
}
