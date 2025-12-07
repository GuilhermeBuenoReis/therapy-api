export class WrongCredentialsError extends Error {
  constructor() {
    super(`Credentials or not valid`);
  }
}