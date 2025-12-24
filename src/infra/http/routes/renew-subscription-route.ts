import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { RenewSubscriptionService } from '@/core/services/renew-subscription-service';
import { ErrorSubscriptionNotFound } from '@/core/services/errors/error-subscription-not-found';
import { ErrorSubscriptionRenewalPeriodInvalid } from '@/core/services/errors/error-subscription-renewal-period-invalid';
import { DrizzleSubscriptionRepository } from '@/infra/db/repositories/drizzle-subscription-repository';
import { SubscriptionPresenter } from '@/infra/http/presenters/subscription-presenter';
import { betterAuthGuard } from '../hooks/better-auth-guard-hook';

export const renewSubscriptionRoute: FastifyPluginAsyncZod = async (app) => {
  app.post(
    '/api/subscriptions/renew',
    {
      onRequest: [betterAuthGuard],
      schema: {
        summary: 'Renew the active subscription for the authenticated professional',
        operationId: 'renewSubscription',
        tags: ['Subscriptions'],
        body: z.object({
          newStartDate: z.string().datetime(),
          newEndDate: z.string().datetime(),
          monthPrice: z.number().positive().optional(),
        }),
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
      const renewSubscriptionService = new RenewSubscriptionService(
        subscriptionRepository
      );

      const sendErrorResponse = (error: unknown) => {
        switch (true) {
          case error instanceof ErrorSubscriptionNotFound:
            return reply.status(404).send({ message: (error as Error).message });
          case error instanceof ErrorSubscriptionRenewalPeriodInvalid:
            return reply.status(400).send({ message: (error as Error).message });
          default: {
            const fallback =
              error instanceof Error
                ? error.message
                : 'Unable to renew subscription.';

            return reply.status(400).send({ message: fallback });
          }
        }
      };

      try {
        const professionalId = request.sub.professionalId;
        const role = request.sub.role;

        if (!professionalId || role !== 'professional') {
          return reply.status(403).send({
            message: 'Only professionals can renew subscriptions.',
          });
        }

        const { newStartDate, newEndDate, monthPrice } = request.body;

        const result = await renewSubscriptionService.handle({
          professionalId,
          newStartDate: new Date(newStartDate),
          newEndDate: new Date(newEndDate),
          monthPrice,
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
