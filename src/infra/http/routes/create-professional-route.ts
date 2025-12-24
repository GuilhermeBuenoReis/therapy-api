import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { CreateProfessionalsService } from '@/core/services/create-professionals-service';
import { PaymentConfirmationRequiredError } from '@/core/services/errors/payment-confirmation-required-error';
import { ErrorUserNotFound } from '@/core/services/errors/user-not-found';
import { DrizzleProfessionalRepository } from '@/infra/db/repositories/drizzle-professional-repository';
import { DrizzleUserRepository } from '@/infra/db/repositories/drizzle-user-repository';
import { ProfessionalPresenter } from '@/infra/http/presenters/professional-presenter';
import { betterAuthGuard } from '../hooks/better-auth-guard-hook';

export const createProfessionalRoute: FastifyPluginAsyncZod = async (app) => {
  app.post(
    '/api/professionals/create',
    {
      onRequest: [betterAuthGuard],
      schema: {
        summary: 'Create a professional profile',
        operationId: 'createProfessional',
        tags: ['Professionals'],
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
          201: z.object({
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
          400: z.object({ message: z.string() }),
          403: z.object({ message: z.string() }),
          404: z.object({ message: z.string() }),
          500: z.object({ message: z.string() }),
        },
      },
    },
    async (request, reply) => {
      const professionalsRepository = new DrizzleProfessionalRepository();
      const userRepository = new DrizzleUserRepository();

      const createProfessionalsService = new CreateProfessionalsService(
        professionalsRepository,
        userRepository
      );

      try {
        const userId = request.sub.userId;

        const {
          specialty,
          registrationNumber,
          phone,
          biography,
          pricePerSession,
          monthlyPrice,
          sessionDuration,
        } = request.body;

        const result = await createProfessionalsService.handle({
          userId,
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

          switch (true) {
            case error instanceof ErrorUserNotFound:
              return reply.status(404).send({ message: (error as Error).message });
            case error instanceof PaymentConfirmationRequiredError:
              return reply.status(403).send({ message: (error as Error).message });
            default:
              return reply.status(400).send({ message: error });
          }
        }

        const { professionals } = result.value;

        return reply
          .status(201)
          .send({ professional: ProfessionalPresenter.toHTTP(professionals) });
      } catch (error) {
        console.error(error);
        request.log.error(error);
        return reply.status(500).send({ message: 'Internal server error' });
      }
    }
  );
};
