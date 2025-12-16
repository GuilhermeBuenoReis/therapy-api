import type { FastifyReply, FastifyRequest } from 'fastify';

export const SESSION_COOKIE_NAME = 'better-auth.session_token';
const DEFAULT_SESSION_TTL_MS = 60 * 60 * 1000; // 1 hour

interface IssueSessionCookieParams {
  reply: FastifyReply;
  request: FastifyRequest;
}

interface IssueSessionResponseParams extends IssueSessionCookieParams {
  token: string;
  expiresAt?: Date;
}

export class SessionCookieManager {
  issueSessionCookie({
    reply,
    request,
    token,
    expiresAt,
  }: IssueSessionResponseParams): void {
    const targetExpiry = expiresAt ?? this.computeDefaultExpiry();
    const maxAgeSeconds = this.calculateMaxAgeSeconds(targetExpiry);

    reply.setCookie(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      secure: this.isSecureRequest(request),
      maxAge: maxAgeSeconds,
      expires: targetExpiry,
    });
  }

  private computeDefaultExpiry(): Date {
    return new Date(Date.now() + DEFAULT_SESSION_TTL_MS);
  }

  private calculateMaxAgeSeconds(expiry: Date): number {
    const diff = Math.floor((expiry.getTime() - Date.now()) / 1000);
    return diff > 0 ? diff : 0;
  }

  private isSecureRequest(request: FastifyRequest): boolean {
    const forwardedProto = this.normalizeHeader(
      request.headers['x-forwarded-proto']
    );
    const protocol = forwardedProto ?? request.protocol;
    return protocol === 'https';
  }

  private normalizeHeader(
    value: string | string[] | undefined
  ): string | undefined {
    if (!value) {
      return undefined;
    }

    return Array.isArray(value) ? value[0] : value;
  }
}
