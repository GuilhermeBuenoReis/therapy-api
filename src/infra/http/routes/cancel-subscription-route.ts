import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { CancelSubscriptionService } from '@/core/services/cancel-subscription-service';
import { ErrorSubscriptionNotFound } from '@/core/services/errors/error-subscription-not-found';
import { DrizzleSubscriptionRepository } from '@/infra/db/repositories/drizzle-subscription-repository';
import { SubscriptionPresenter } from '@/infra/http/presenters/subscription-presenter';
import { betterAuthGuard } from '../hooks/better-auth-guard-hook';

export const cancelSubscriptionRoute: FastifyPluginAsyncZod = async (app) => {
  app.post(
    '/api/subscriptions/cancel',
    {
      onRequest: [betterAuthGuard],
      schema: {
        summary: 'Cancel the active subscription for the authenticated professional',
        operationId: 'cancelSubscription',
        tags: ['Subscriptions'],
        response: {
          200: z.object({
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
          404: z.object({ message: z.string() }),
          500: z.object({ message: z.string() }),
        },
      },
    },
    async (request, reply) => {
      const subscriptionRepository = new DrizzleSubscriptionRepository();
      const cancelSubscriptionService = new CancelSubscriptionService(
        subscriptionRepository
      );

      const sendErrorResponse = (error: unknown) => {
        if (error instanceof ErrorSubscriptionNotFound) {
          return reply.status(404).send({ message: error.message });
        }

        const fallback =
          error instanceof Error
            ? error.message
            : 'Unable to cancel subscription.';

        return reply.status(400).send({ message: fallback });
      };

      try {
        const professionalId = request.sub.professionalId;
        const role = request.sub.role;

        if (!professionalId || role !== 'professional') {
          return reply.status(403).send({
            message: 'Only professionals can cancel subscriptions.',
          });
        }

        const result = await cancelSubscriptionService.handle({
          professionalId,
        });

        if (result.isLeft()) {
          return sendErrorResponse(result.value);
        }

        const { subscription } = result.value;

        return reply
          .status(200)
          .send({ subscription: SubscriptionPresenter.toHTTP(subscription) });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ message: 'Internal server error' });
      }
    }
  );
};
