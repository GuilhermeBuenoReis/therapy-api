import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { ProfessionalNotFoundError } from '@/core/services/errors/professional-not-found-error';
import { FindProfessionalsByIdService } from '@/core/services/find-professionals-by-id-service';
import { DrizzleProfessionalRepository } from '@/infra/db/repositories/drizzle-professional-repository';
import { ProfessionalPresenter } from '@/infra/http/presenters/professional-presenter';
import { betterAuthGuard } from '../hooks/better-auth-guard-hook';

export const findProfessionalByIdRoute: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/api/professionals/:professionalId',
    {
      onRequest: [betterAuthGuard],
      schema: {
        summary: 'Find a professional by id',
        operationId: 'findProfessionalById',
        tags: ['Professionals'],
        params: z.object({
          professionalId: z.string().uuid(),
        }),
        response: {
          200: z.object({
            professional: z.object({
              id: z.string().uuid(),
              userId: z.string().uuid(),
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
          400: z.object({ message: z.string() }),
          404: z.object({ message: z.string() }),
          500: z.object({ message: z.string() }),
        },
      },
    },
    async (request, reply) => {
      const professionalsRepository = new DrizzleProfessionalRepository();
      const findProfessionalsByIdService = new FindProfessionalsByIdService(
        professionalsRepository
      );

      try {
        const { professionalId } = request.params;

        const result = await findProfessionalsByIdService.handle({
          professionalId,
        });

        if (result.isLeft()) {
          const error = result.value;

          if (error instanceof ProfessionalNotFoundError) {
            return reply.status(404).send({ message: error.message });
          }

          return reply.status(400).send({ message: error });
        }

        const { professional } = result.value;

        return reply
          .status(200)
          .send({ professional: ProfessionalPresenter.toHTTP(professional) });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ message: 'Internal server error' });
      }
    }
  );
};
