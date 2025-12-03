export class ErrorInvalidChronologicalStatus extends Error {
  constructor() {
    super('Invalid chronological status transition.');
    this.name = 'ErrorInvalidChronologicalStatus';
  }
}
