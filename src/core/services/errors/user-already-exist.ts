export class UserAlreadyExist extends Error {
  constructor() {
    super('User already exists with this email.');
    this.name = 'UserAlreadyExist';
  }
}
