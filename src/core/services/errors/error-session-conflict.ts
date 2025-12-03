export class ErrorSessionConflict extends Error {
  constructor() {
    super(
      'A session already exists for this professional at the given date and time.'
    );
    this.name = 'ErrorSessionConflict';
  }
}
