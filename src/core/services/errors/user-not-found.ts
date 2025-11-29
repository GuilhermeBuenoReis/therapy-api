export class UserNotFound extends Error {
  constructor() {
    super('User not found with this email.');
    this.name = 'UserNotFound';
  }
}
