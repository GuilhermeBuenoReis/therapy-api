export class ErrorInvalidSessionStatusTransition extends Error {
  constructor(currentStatus: string, newStatus: string) {
    super(
      `Invalid session status transition from "${currentStatus}" to "${newStatus}".`
    );
    this.name = 'ErrorInvalidSessionStatusTransition';
  }
}
