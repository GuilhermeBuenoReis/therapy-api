export class ErrorSubscriptionPaymentsNotFound extends Error {
  constructor() {
    super('No subscription payments found for this professional.');
    this.name = 'ErrorSubscriptionPaymentsNotFound';
  }
}
