import 'fastify';

declare module 'fastify' {
  interface FastifyRequest {
    authUser?: {
      userId: string;
      sessionId: string;
      email: string;
      professionalId?: string;
      role?: 'professional' | 'patient';
    };
  }
}
