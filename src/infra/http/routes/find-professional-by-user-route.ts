import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { ProfessionalNotFoundError } from '@/core/services/errors/professional-not-found-error';
import { ErrorUserNotFound } from '@/core/services/errors/user-not-found';
import { FindProfessionalForUserService } from '@/core/services/find-professional-for-user-service';
import { DrizzleProfessionalRepository } from '@/infra/db/repositories/drizzle-professional-repository';
import { DrizzleUserRepository } from '@/infra/db/repositories/drizzle-user-repository';
import { ProfessionalPresenter } from '@/infra/http/presenters/professional-presenter';
import { betterAuthGuard } from '../hooks/better-auth-guard-hook';

export const findProfessionalByUserRoute: FastifyPluginAsyncZod = async (
  app
) => {
  app.get(
    '/api/users/professionals/:professionalId',
    {
      onRequest: [betterAuthGuard],
      schema: {
        summary: 'Find a professional by user id',
        operationId: 'findProfessionalByUser',
        tags: ['Professionals'],
        params: z.object({
          professionalId: z.uuid(),
        }),
        response: {
          200: z.object({
            professional: z.object({
              id: z.uuid(),
              userId: z.uuid(),
              specialty: z.string(),
              registrationNumber: z.string(),
              phone: z.string(),
              biography: z.string(),
              pricePerSession: z.number(),
              monthlyPrice: z.number(),
              sessionDuration: z.number(),
              createdAt: z.iso.datetime(),
              updatedAt: z.iso.datetime().nullable(),
            }),
          }),
          404: z.object({ message: z.string() }),
          400: z.object({ message: z.string() }),
          500: z.object({ message: z.string() }),
        },
      },
    },
    async (request, reply) => {
      const professionalRepository = new DrizzleProfessionalRepository();
      const userRepository = new DrizzleUserRepository();

      const findProfessionalByUserService = new FindProfessionalForUserService(
        userRepository,
        professionalRepository
      );

      try {
        const userId = request.sub.userId;
        const { professionalId } = request.params;

        const result = await findProfessionalByUserService.handle({
          userId,
          professionalId,
        });

        if (result.isLeft()) {
          const error = result.value;

          if (
            error instanceof ErrorUserNotFound ||
            error instanceof ProfessionalNotFoundError
          ) {
            return reply.status(404).send({ message: error.message });
          }

          return reply.status(400).send({ message: error });
        }

        const { professional } = result.value;

        return reply.status(200).send({
          professional: ProfessionalPresenter.toHTTP(professional),
        });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ message: 'Internal server error' });
      }
    }
  );
};
