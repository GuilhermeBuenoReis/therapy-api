import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { ConfirmUserPaymentService } from '@/core/services/confirm-user-payment-service';
import { ErrorUserNotFound } from '@/core/services/errors/user-not-found';
import { DrizzleUserRepository } from '@/infra/db/repositories/drizzle-user-repository';
import { betterAuthGuard } from '../hooks/better-auth-guard-hook';

export const confirmUserPaymentRoute: FastifyPluginAsyncZod = async (app) => {
  app.post(
    '/api/payments/confirm',
    {
      onRequest: [betterAuthGuard],
      schema: {
        summary: 'Confirm payment for the authenticated user',
        operationId: 'confirmUserPayment',
        tags: ['Payments'],
        body: z
          .object({
            confirmedAt: z.string().datetime().optional(),
          })
          .optional(),
        response: {
          200: z.object({
            id: z.string().uuid(),
            name: z.string(),
            email: z.string().email(),
            role: z.enum(['professional', 'patient']),
            paymentConfirmedAt: z.string().datetime().nullable(),
            createdAt: z.string().datetime(),
            updatedAt: z.string().datetime().nullable(),
          }),
          400: z.object({ message: z.string() }),
          401: z.object({ message: z.string() }),
          404: z.object({ message: z.string() }),
          500: z.object({ message: z.string() }),
        },
      },
    },
    async (request, reply) => {
      const userRepository = new DrizzleUserRepository();
      const confirmUserPaymentService = new ConfirmUserPaymentService(
        userRepository
      );

      const sendErrorResponse = (error: unknown) => {
        if (error instanceof ErrorUserNotFound) {
          return reply.status(404).send({ message: error.message });
        }

        const fallback =
          error instanceof Error ? error.message : 'Unable to confirm payment.';

        return reply.status(400).send({ message: fallback });
      };

      try {
        const userId = request.sub.userId;

        const confirmedAt = request.body?.confirmedAt
          ? new Date(request.body.confirmedAt)
          : undefined;

        const result = await confirmUserPaymentService.execute({
          userId,
          confirmedAt,
        });

        if (result.isLeft()) {
          return sendErrorResponse(result.value);
        }

        const { user } = result.value;

        return reply.status(200).send({
          id: user.id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          paymentConfirmedAt: user.paymentConfirmedAt
            ? user.paymentConfirmedAt.toISOString()
            : null,
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt ? user.updatedAt.toISOString() : null,
        });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ message: 'Internal server error' });
      }
    }
  );
};
