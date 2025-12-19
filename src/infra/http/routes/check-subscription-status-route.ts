import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import {
  CheckSubscriptionStatusService,
  SubscriptionAccessLevel,
} from '@/core/services/check-subscription-status-service';
import { ErrorSubscriptionNotFound } from '@/core/services/errors/error-subscription-not-found';
import { DrizzleSubscriptionRepository } from '@/infra/db/repositories/drizzle-subscription-repository';
import { SubscriptionPresenter } from '@/infra/http/presenters/subscription-presenter';
import { betterAuthGuard } from '../hooks/better-auth-guard-hook';

export const checkSubscriptionStatusRoute: FastifyPluginAsyncZod = async (
  app
) => {
  app.get(
    '/api/subscriptions/status',
    {
      onRequest: [betterAuthGuard],
      schema: {
        summary:
          'Check the current subscription status for the authenticated professional',
        operationId: 'checkSubscriptionStatus',
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
            accessLevel: z.enum([
              SubscriptionAccessLevel.Active,
              SubscriptionAccessLevel.GraceReadOnly,
              SubscriptionAccessLevel.Blocked,
            ]),
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
      const checkSubscriptionStatusService = new CheckSubscriptionStatusService(
        subscriptionRepository
      );

      const sendErrorResponse = (error: unknown) => {
        if (error instanceof ErrorSubscriptionNotFound) {
          return reply.status(404).send({ message: error.message });
        }

        const fallback =
          error instanceof Error
            ? error.message
            : 'Unable to check subscription status.';

        return reply.status(400).send({ message: fallback });
      };

      try {
        const professionalId = request.sub.professionalId;
        const role = request.sub.role;

        if (!professionalId || role !== 'professional') {
          return reply.status(403).send({
            message: 'Only professionals can check subscription status.',
          });
        }

        const result = await checkSubscriptionStatusService.handle({
          professionalId,
        });

        if (result.isLeft()) {
          return sendErrorResponse(result.value);
        }

        const { subscription, accessLevel } = result.value;

        return reply.status(200).send({
          subscription: SubscriptionPresenter.toHTTP(subscription),
          accessLevel,
        });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ message: 'Internal server error' });
      }
    }
  );
};
