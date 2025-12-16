import type { UserRole } from '@/core/entities/user';
import type {
  AuthGuardMiddleware,
  EnsureAuthenticatedRequest,
  EnsureAuthenticatedResponse,
} from '@/core/middleware/auth-guard-middleware';
import { UserNotAuthenticatedError } from '@/core/middleware/user-not-authenticated-error';
import { left, right } from '@/core/utils/either';
import { SESSION_COOKIE_NAME } from '../lib/session-cookie';

type SessionCookiePayload = {
  userId: string;
  professionalId: string;
  role: UserRole;
  email: string;
  sessionId: string;
  issuedAt: string;
  expiresAt: string;
  nonce: string;
};

export class BetterAuthGuardMiddleware implements AuthGuardMiddleware {
  async ensureAuthenticated({
    headers,
    cookies,
  }: EnsureAuthenticatedRequest): Promise<EnsureAuthenticatedResponse> {
    try {
      const sessionToken =
        this.extractTokenFromCookies(cookies) ??
        this.extractTokenFromHeaders(headers);

      if (!sessionToken) {
        return left(new UserNotAuthenticatedError());
      }

      const payload = this.decodeSessionToken(sessionToken);
      if (!payload) {
        return left(new UserNotAuthenticatedError());
      }

      const expiresAt = new Date(payload.expiresAt);
      if (Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() <= Date.now()) {
        return left(new UserNotAuthenticatedError());
      }

      return right({
        session: {
          id: payload.sessionId,
          userId: payload.userId,
          expiresAt,
          professionalId: payload.professionalId,
          role: payload.role,
        },
        user: {
          id: payload.userId,
          email: payload.email,
          name: undefined,
        },
      });
    } catch {
      return left(new UserNotAuthenticatedError());
    }
  }

  private extractTokenFromCookies(
    cookies: Record<string, string | undefined> | undefined
  ): string | undefined {
    if (!cookies) {
      return undefined;
    }

    const value = cookies[SESSION_COOKIE_NAME];
    return value?.trim() || undefined;
  }

  private extractTokenFromHeaders(
    headers: Record<string, string | string[] | undefined>
  ): string | undefined {
    const cookieHeader = this.normalizeHeader(
      headers?.cookie ?? headers?.Cookie
    );

    if (!cookieHeader) {
      return undefined;
    }

    const cookies = this.parseCookies(cookieHeader);
    return cookies.get(SESSION_COOKIE_NAME);
  }

  private normalizeHeader(
    value: string | string[] | undefined
  ): string | undefined {
    if (!value) {
      return undefined;
    }

    return Array.isArray(value) ? value[0] : value;
  }

  private parseCookies(header: string): Map<string, string> {
    return header.split(';').reduce((acc, part) => {
      const [rawKey, ...rest] = part.split('=');
      const key = rawKey.trim();
      if (!key) {
        return acc;
      }

      const value = rest.join('=').trim();
      acc.set(key, value);
      return acc;
    }, new Map<string, string>());
  }

  private decodeSessionToken(token: string): SessionCookiePayload | null {
    try {
      const json = Buffer.from(token, 'base64url').toString('utf8');
      return JSON.parse(json) as SessionCookiePayload;
    } catch {
      return null;
    }
  }
}
