export class ErrorUserAlreadyExists extends Error {
  constructor() {
    super('User already exists with this email.');
    this.name = 'ErrorUserAlreadyExists';
  }
}
