import { randomBytes } from 'node:crypto';
import type {
  AuthSession,
  AuthSessionMiddleware,
  AuthSessionPayload,
} from '@/core/middleware/auth-session-middleware';

export const SESSION_COOKIE_NAME = 'better-auth.session_token';
const SESSION_TTL_IN_MS = 1000 * 60 * 60; // 1 hour

type SessionTokenPayload = AuthSessionPayload & {
  sessionId: string;
  issuedAt: string;
  expiresAt: string;
  nonce: string;
};

export class BetterAuthSessionMiddleware implements AuthSessionMiddleware {
  async createSession(payload: AuthSessionPayload): Promise<AuthSession> {
    const issuedAt = new Date();
    const expiresAt = new Date(issuedAt.getTime() + SESSION_TTL_IN_MS);
    const sessionId = randomBytes(8).toString('hex');

    const tokenPayload: SessionTokenPayload = {
      ...payload,
      sessionId,
      issuedAt: issuedAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
      nonce: randomBytes(8).toString('hex'),
    };

    const token = Buffer.from(JSON.stringify(tokenPayload)).toString(
      'base64url'
    );

    return {
      token,
      expiresAt,
    };
  }
}
