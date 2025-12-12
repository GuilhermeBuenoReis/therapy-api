export class ProfessionalRoleRequiredError extends Error {
  constructor() {
    super('Only professional users can authenticate.');
  }
}
