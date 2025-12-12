import type { UserRole } from '../entities/user';

export interface AuthSessionPayload {
  userId: string;
  professionalId: string;
  role: UserRole;
}

export interface AuthSession {
  token: string;
  expiresAt?: Date;
}

export interface AuthSessionGateway {
  createSession(payload: AuthSessionPayload): Promise<AuthSession>;
}
