import type { UserRole } from '../entities/user';

export interface AuthSessionPayload {
  userId: string;
  professionalId: string;
  role: UserRole;
  email: string;
}

export interface AuthSession {
  token: string;
  expiresAt?: Date;
}

export interface AuthSessionMiddleware {
  createSession(payload: AuthSessionPayload): Promise<AuthSession>;
}
