import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { CreateSubscriptionService } from '@/core/services/create-subscription-service';
import { ErrorSubscriptionAlreadyExists } from '@/core/services/errors/subscription-already-exists';
import { DrizzleSubscriptionRepository } from '@/infra/db/repositories/drizzle-subscription-repository';
import { SubscriptionPresenter } from '@/infra/http/presenters/subscription-presenter';
import { betterAuthGuard } from '../hooks/better-auth-guard-hook';

export const createSubscriptionRoute: FastifyPluginAsyncZod = async (app) => {
  app.post(
    '/api/subscriptions',
    {
      onRequest: [betterAuthGuard],
      schema: {
        summary: 'Create a subscription for the authenticated professional',
        operationId: 'createSubscription',
        tags: ['Subscriptions'],
        body: z.object({
          monthPrice: z.number().positive(),
          startDate: z.string().datetime(),
          endDate: z.string().datetime(),
        }),
        response: {
          201: z.object({
            subscription: z.object({
              id: z.string().uuid(),
              professionalId: z.string().uuid(),
              monthPrice: z.number(),
              status: z.enum(['active', 'expired', 'canceled', 'pending']),
              startDate: z.string().datetime(),
              endDate: z.string().datetime(),
              createdAt: z.string().datetime(),
              updatedAt: z.string().datetime().nullable(),
            }),
          }),
          400: z.object({ message: z.string() }),
          401: z.object({ message: z.string() }),
          403: z.object({ message: z.string() }),
          409: z.object({ message: z.string() }),
          500: z.object({ message: z.string() }),
        },
      },
    },
    async (request, reply) => {
      const subscriptionRepository = new DrizzleSubscriptionRepository();
      const createSubscriptionService = new CreateSubscriptionService(
        subscriptionRepository
      );

      const sendErrorResponse = (error: unknown) => {
        if (error instanceof ErrorSubscriptionAlreadyExists) {
          return reply.status(409).send({ message: error.message });
        }

        const fallback =
          error instanceof Error
            ? error.message
            : 'Unable to create subscription.';

        return reply.status(400).send({ message: fallback });
      };

      try {
        const professionalId = request.sub.professionalId;
        const role = request.sub.role;

        if (!professionalId || role !== 'professional') {
          return reply.status(403).send({
            message: 'Only professionals can create subscriptions.',
          });
        }

        const { monthPrice, startDate, endDate } = request.body;

        const result = await createSubscriptionService.createSubscription({
          professionalId,
          monthPrice,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
        });

        if (result.isLeft()) {
          return sendErrorResponse(result.value);
        }

        const { subscription } = result.value;

        return reply
          .status(201)
          .send({ subscription: SubscriptionPresenter.toHTTP(subscription) });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ message: 'Internal server error' });
      }
    }
  );
};
