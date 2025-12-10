export class ErrorSubscriptionNotFound extends Error {
  constructor() {
    super('Professional does not have an active subscription.');
  }
}
