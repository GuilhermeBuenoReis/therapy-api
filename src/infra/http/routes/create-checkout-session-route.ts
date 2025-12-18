import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { CreateCheckoutSessionService } from '@/core/services/create-checkout-session-service';
import { env } from '@/infra/env';
import { StripePaymentProvider } from '@/infra/http/lib/stripe-payment-provider';
import { betterAuthGuard } from '../hooks/better-auth-guard-hook';

export const createCheckoutSessionRoute: FastifyPluginAsyncZod = async (
  app
) => {
  app.post(
    '/api/payments/checkout-session',
    {
      onRequest: [betterAuthGuard],
      schema: {
        summary: 'Create a Stripe Checkout session',
        operationId: 'createCheckoutSession',
        tags: ['Payments'],
        body: z.object({
          priceId: z.string().min(1),
          mode: z.enum(['subscription', 'payment']).default('subscription'),
          quantity: z.number().int().min(1).max(12).optional(),
        }),
        response: {
          201: z.object({
            checkoutSessionId: z.string(),
            url: z.string().url(),
          }),
          400: z.object({ message: z.string() }),
          401: z.object({ message: z.string() }),
          403: z.object({ message: z.string() }),
          500: z.object({ message: z.string() }),
        },
      },
    },
    async (request, reply) => {
      const stripeProvider = new StripePaymentProvider();
      const createCheckoutSessionService = new CreateCheckoutSessionService(
        stripeProvider
      );
      try {
        if (
          request.sub.role !== 'professional' ||
          !request.sub.professionalId
        ) {
          return reply
            .status(403)
            .send({ message: 'Only professionals can start a checkout.' });
        }

        const { priceId, mode, quantity } = request.body;

        const result = await createCheckoutSessionService.execute({
          professionalId: request.sub.professionalId,
          userId: request.sub.userId,
          priceId,
          mode,
          successUrl: env.FRONTEND_SUCCESS_URL,
          cancelUrl: env.FRONTEND_CANCEL_URL,
          quantity,
          customerEmail: request.sub.email,
        });

        if (result.isLeft()) {
          return reply.status(400).send({
            message: result.value.message ?? 'Unable to create session.',
          });
        }

        return reply.status(201).send({
          checkoutSessionId: result.value.sessionId,
          url: result.value.url,
        });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ message: 'Internal server error' });
      }
    }
  );
};
