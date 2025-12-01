export class ErrorUserNotFound extends Error {
  constructor() {
    super('User not found with this email.');
    this.name = 'ErrorUserNotFound';
  }
}
