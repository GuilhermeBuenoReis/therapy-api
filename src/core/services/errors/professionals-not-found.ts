export class ProfessionalsNotFound extends Error {
  constructor() {
    super('Professionals not found');
    this.name = 'ProfessionalsNotFound';
  }
}
