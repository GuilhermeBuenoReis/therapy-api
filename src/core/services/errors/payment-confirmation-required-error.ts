export class PaymentConfirmationRequiredError extends Error {
  constructor() {
    super('User must complete the onboarding payment before creating a professional profile.');
  }
}
