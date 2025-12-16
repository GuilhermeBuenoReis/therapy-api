import type { FastifyReply, FastifyRequest } from 'fastify';
import { BetterAuthGuardMiddleware } from '../middleware/better-auth-guard-middleware';

const guard = new BetterAuthGuardMiddleware();

export async function betterAuthGuard(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const result = await guard.ensureAuthenticated({
    headers: request.headers as Record<string, string | string[] | undefined>,
  });

  if (result.isLeft()) {
    return reply.status(401).send({ message: result.value.message });
  }

  request.authUser = {
    userId: result.value.user.id,
    sessionId: result.value.session.id,
    email: result.value.user.email,
    professionalId: result.value.session.professionalId,
    role: result.value.session.role,
  };
}
