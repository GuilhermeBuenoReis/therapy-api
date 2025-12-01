export class ErrorPatientNotLinkedToProfessional extends Error {
  constructor(id: string) {
    super(`Patient not linked to a professional with id: ${id}.`);
    this.name = 'ErrorPatientNotLinkedToProfessional';
  }
}
