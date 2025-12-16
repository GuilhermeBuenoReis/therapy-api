import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { AuthenticateProfessionalService } from '@/core/services/authenticate-professional-by-user';
import { ProfessionalProfileNotFoundError } from '@/core/services/errors/professional-profile-not-found-error';
import { ProfessionalRoleRequiredError } from '@/core/services/errors/professional-role-required-error';
import { WrongCredentialsError } from '@/core/services/errors/wrong-creadentials-error';
import { BcryptHasher } from '@/infra/cryptography/bcrypt-hasher';
import { DrizzleProfessionalRepository } from '@/infra/db/repositories/drizzle-professional-repository';
import { DrizzleUserRepository } from '@/infra/db/repositories/drizzle-user-repository';
import { BetterAuthSessionMiddleware } from '@/infra/http/middleware/better-auth-session-middleware';
import { SessionCookieManager } from '@/infra/http/lib/session-cookie';

export const authenticateProfessionalRoute: FastifyPluginAsyncZod = async (
  app
) => {
  const userRepository = new DrizzleUserRepository();
  const professionalRepository = new DrizzleProfessionalRepository();
  const hashComparer = new BcryptHasher();
  const sessionGateway = new BetterAuthSessionMiddleware();
  const sessionCookieManager = new SessionCookieManager();

  const authenticateProfessionalService = new AuthenticateProfessionalService(
    userRepository,
    professionalRepository,
    hashComparer,
    sessionGateway
  );

  app.post(
    '/api/auth/professional',
    {
      schema: {
        summary: 'Authenticate a professional user',
        operationId: 'authenticateProfessional',
        tags: ['Auth'],
        body: z.object({
          email: z.email(),
          password: z.string().min(8),
        }),
        response: {
          200: z.object({
            sessionToken: z.string(),
            sessionExpiresAt: z.iso.datetime().nullable(),
            authenticatedUser: z.object({
              userId: z.string(),
              professionalId: z.string(),
              role: z.enum(['professional', 'patient']),
            }),
          }),
          400: z.object({
            message: z.string(),
          }),
          401: z.object({
            message: z.string(),
          }),
          403: z.object({
            message: z.string(),
          }),
          404: z.object({
            message: z.string(),
          }),
          500: z.object({
            message: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      try {
        const { email, password } = request.body;
        const result = await authenticateProfessionalService.execute({
          email,
          password,
        });

        if (result.isLeft()) {
          const error = result.value;

          switch (true) {
            case error instanceof WrongCredentialsError:
              return reply.status(401).send({ message: error.message });
            case error instanceof ProfessionalRoleRequiredError:
              return reply.status(403).send({ message: error.message });
            case error instanceof ProfessionalProfileNotFoundError:
              return reply.status(404).send({ message: error.message });
            default:
              return reply.status(400).send({ message: error });
          }
        }

        const { sessionToken, sessionExpiresAt, authenticatedUser } =
          result.value;

        sessionCookieManager.issueSessionCookie({
          reply,
          request,
          token: sessionToken,
          expiresAt: sessionExpiresAt,
        });

        return reply.status(200).send({
          sessionToken,
          sessionExpiresAt: sessionExpiresAt?.toISOString() ?? null,
          authenticatedUser,
        });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ message: 'Internal server error' });
      }
    }
  );
};
