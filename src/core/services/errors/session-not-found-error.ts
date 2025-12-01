export class ErrorSessionNotFound extends Error {
  constructor() {
    super('Session not found.');
    this.name = 'ErrorSessionNotFound';
  }
}
