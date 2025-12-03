import { SessionStatus } from '../../entities/session';

export const allowedTransitions: Record<SessionStatus, SessionStatus[]> = {
  [SessionStatus.scheduled]: [SessionStatus.inProgress, SessionStatus.canceled],

  [SessionStatus.inProgress]: [SessionStatus.completed, SessionStatus.canceled],

  [SessionStatus.completed]: [],

  [SessionStatus.canceled]: [],
};
