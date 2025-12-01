export class ErrorSessionAlreadyExists extends Error {
  constructor() {
    super('Session already exists.');
    this.name = 'ErrorSessionAlreadyExists';
  }
}
