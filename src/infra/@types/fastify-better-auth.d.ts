import 'fastify';

declare module 'fastify' {
  interface FastifyRequest {
    sub: {
      userId: string;
      sessionId: string;
      email: string;
      professionalId?: string;
      role?: 'professional' | 'patient';
    };
  }
}
