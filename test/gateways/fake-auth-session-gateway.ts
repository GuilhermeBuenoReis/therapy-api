import type {
  AuthSession,
  AuthSessionGateway,
  AuthSessionPayload,
} from '../../src/core/middleware/auth-session-middleware';

export class FakeAuthSessionGateway implements AuthSessionGateway {
  async createSession(payload: AuthSessionPayload): Promise<AuthSession> {
    return {
      token: JSON.stringify(payload),
      expiresAt: new Date(Date.now() + 1000 * 60 * 60), // 1 hour later
    };
  }
}
