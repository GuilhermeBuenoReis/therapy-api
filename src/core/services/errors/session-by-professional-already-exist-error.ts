export class ErrorSessionByProfessionalAlreadyExists extends Error {
  constructor() {
    super('This session is not linked to this professional.');
    this.name = 'ErrorSessionByProfessionalAlreadyExists';
  }
}
