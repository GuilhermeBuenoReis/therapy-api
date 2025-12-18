import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { DeleteProfessionalsService } from '@/core/services/delete-professionals-service';
import { ErrorProfessionalsNotFound } from '@/core/services/errors/professionals-not-found';
import { DrizzleProfessionalRepository } from '@/infra/db/repositories/drizzle-professional-repository';
import { betterAuthGuard } from '../hooks/better-auth-guard-hook';

export const deleteProfessionalRoute: FastifyPluginAsyncZod = async (app) => {
  const professionalsRepository = new DrizzleProfessionalRepository();
  const deleteProfessionalsService = new DeleteProfessionalsService(
    professionalsRepository
  );

  app.delete(
    '/api/professionals/:professionalId',
    {
      onRequest: [betterAuthGuard],
      schema: {
        summary: 'Delete a professional profile',
        operationId: 'deleteProfessional',
        tags: ['Professionals'],
        params: z.object({
          professionalId: z.string().uuid(),
        }),
        response: {
          204: z.null(),
          400: z.object({ message: z.string() }),
          404: z.object({ message: z.string() }),
          500: z.object({ message: z.string() }),
        },
      },
    },
    async (request, reply) => {
      try {
        const { professionalId } = request.params;

        const result = await deleteProfessionalsService.handle({
          professionalsId: professionalId,
        });

        if (result.isLeft()) {
          const error = result.value;

          if (error instanceof ErrorProfessionalsNotFound) {
            return reply.status(404).send({ message: error.message });
          }

          return reply.status(400).send({ message: error });
        }

        return reply.status(204).send();
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ message: 'Internal server error' });
      }
    }
  );
};
