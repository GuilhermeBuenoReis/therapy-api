import type { UserRole } from '../entities/user';
import type { Either } from '../utils/either';
import type { UserNotAuthenticatedError } from './user-not-authenticated-error';

export interface EnsureAuthenticatedRequest {
  headers: Record<string, string | string[] | undefined>;
}

export interface AuthenticatedSession {
  id: string;
  userId: string;
  expiresAt?: Date;
  professionalId?: string;
  role?: UserRole;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  name?: string;
}

export type EnsureAuthenticatedResponse = Either<
  UserNotAuthenticatedError,
  {
    session: AuthenticatedSession;
    user: AuthenticatedUser;
  }
>;

export interface AuthGuardMiddleware {
  ensureAuthenticated(
    request: EnsureAuthenticatedRequest
  ): Promise<EnsureAuthenticatedResponse>;
}
