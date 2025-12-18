import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { EditProfessionalsService } from '@/core/services/edit-professionals-service';
import { ErrorProfessionalsNotFound } from '@/core/services/errors/professionals-not-found';
import { DrizzleProfessionalRepository } from '@/infra/db/repositories/drizzle-professional-repository';
import { ProfessionalPresenter } from '@/infra/http/lib/professional-presenter';
import { betterAuthGuard } from '../hooks/better-auth-guard-hook';

export const updateProfessionalRoute: FastifyPluginAsyncZod = async (app) => {
  const professionalsRepository = new DrizzleProfessionalRepository();
  const editProfessionalsService = new EditProfessionalsService(
    professionalsRepository
  );

  app.put(
    '/api/professionals/:professionalId',
    {
      onRequest: [betterAuthGuard],
      schema: {
        summary: 'Update a professional profile',
        operationId: 'updateProfessional',
        tags: ['Professionals'],
        params: z.object({
          professionalId: z.string().uuid(),
        }),
        body: z.object({
          specialty: z.string().min(1),
          registrationNumber: z.string().min(1),
          phone: z.string().min(1),
          biography: z.string().min(1),
          pricePerSession: z.number().positive(),
          monthlyPrice: z.number().positive(),
          sessionDuration: z.number().positive(),
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
      try {
        const { professionalId } = request.params;
        const {
          specialty,
          registrationNumber,
          phone,
          biography,
          pricePerSession,
          monthlyPrice,
          sessionDuration,
        } = request.body;

        const result = await editProfessionalsService.handle({
          professionalsId: professionalId,
          specialty,
          registration_number: registrationNumber,
          phone,
          biography,
          pricePerSession,
          monthlyPrice,
          sessionDuration,
        });

        if (result.isLeft()) {
          const error = result.value;

          if (error instanceof ErrorProfessionalsNotFound) {
            return reply.status(404).send({ message: error.message });
          }

          return reply.status(400).send({ message: error });
        }

        const { professionals } = result.value;

        return reply.status(200).send({
          professional: ProfessionalPresenter.toHTTP(professionals),
        });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ message: 'Internal server error' });
      }
    }
  );
};
