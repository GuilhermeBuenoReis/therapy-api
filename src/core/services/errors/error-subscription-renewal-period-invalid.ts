export class ErrorSubscriptionRenewalPeriodInvalid extends Error {
  constructor() {
    super('Subscription renewal period is invalid.');
    this.name = 'ErrorSubscriptionRenewalPeriodInvalid';
  }
}
