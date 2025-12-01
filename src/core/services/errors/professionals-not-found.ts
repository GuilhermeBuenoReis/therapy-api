export class ErrorProfessionalsNotFound extends Error {
  constructor() {
    super('Professionals not found.');
    this.name = 'ErrorProfessionalsNotFound';
  }
}
