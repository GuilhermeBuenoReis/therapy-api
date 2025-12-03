import { describe, expect, it } from 'vitest';
import { SessionStatus } from '../../entities/session';
import { allowedTransitions } from './session-status-transition-rule';

describe('Session Status Transition Rule', () => {
  it('allows scheduled to move only to in-progress or canceled', () => {
    expect(allowedTransitions[SessionStatus.scheduled]).toEqual([
      SessionStatus.inProgress,
      SessionStatus.canceled,
    ]);
  });

  it('allows in-progress to move only to completed or canceled', () => {
    expect(allowedTransitions[SessionStatus.inProgress]).toEqual([
      SessionStatus.completed,
      SessionStatus.canceled,
    ]);
  });

  it('does not allow transitions from completed or canceled', () => {
    expect(allowedTransitions[SessionStatus.completed]).toEqual([]);
    expect(allowedTransitions[SessionStatus.canceled]).toEqual([]);
  });
});
