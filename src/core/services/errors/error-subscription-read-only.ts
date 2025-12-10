export class ErrorSubscriptionReadOnly extends Error {
  constructor() {
    super('Subscription expired. Only read operations are allowed for 7 days.');
  }
}
