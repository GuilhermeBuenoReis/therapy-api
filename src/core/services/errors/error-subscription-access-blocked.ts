export class ErrorSubscriptionAccessBlocked extends Error {
  constructor() {
    super('Subscription expired or inactive. Access is blocked.');
  }
}
