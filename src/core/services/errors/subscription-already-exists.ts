export class ErrorSubscriptionAlreadyExists extends Error {
  constructor() {
    super('User already has an active subscription.')
  }
}
