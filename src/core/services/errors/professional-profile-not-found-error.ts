export class ProfessionalProfileNotFoundError extends Error {
  constructor() {
    super('Professional profile not found for this user.');
  }
}
