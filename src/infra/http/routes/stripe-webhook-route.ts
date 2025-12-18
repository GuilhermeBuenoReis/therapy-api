import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { CancelSubscriptionService } from '@/core/services/cancel-subscription-service';
import { ConfirmUserPaymentService } from '@/core/services/confirm-user-payment-service';
import { CreatePaymentService } from '@/core/services/create-payment-service';
import { CreateSubscriptionService } from '@/core/services/create-subscription-service';
import { HandleStripeWebhookService } from '@/core/services/handle-stripe-webhook-service';
import { RenewSubscriptionService } from '@/core/services/renew-subscription-service';
import { DrizzlePaymentRepository } from '@/infra/db/repositories/drizzle-payment-repository';
import { DrizzleSubscriptionRepository } from '@/infra/db/repositories/drizzle-subscription-repository';
import { DrizzleUserRepository } from '@/infra/db/repositories/drizzle-user-repository';
import { StripePaymentProvider } from '@/infra/http/lib/stripe-payment-provider';

export const stripeWebhookRoute: FastifyPluginAsyncZod = async (app) => {
  app.post(
    '/api/payments/stripe/webhook',
    {
      config: {
        rawBody: true,
      },
      schema: {
        summary: 'Stripe webhook receiver',
        tags: ['Payments'],
        response: {
          200: z.object({
            received: z.literal(true),
          }),
          400: z.object({
            message: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      const stripeProvider = new StripePaymentProvider();
      const subscriptionRepository = new DrizzleSubscriptionRepository();
      const userRepository = new DrizzleUserRepository();
      const paymentRepository = new DrizzlePaymentRepository();

      const confirmUserPaymentService = new ConfirmUserPaymentService(
        userRepository
      );
      const createSubscriptionService = new CreateSubscriptionService(
        subscriptionRepository
      );
      const renewSubscriptionService = new RenewSubscriptionService(
        subscriptionRepository
      );
      const cancelSubscriptionService = new CancelSubscriptionService(
        subscriptionRepository
      );
      const createPaymentService = new CreatePaymentService(paymentRepository);

      const handleStripeWebhookService = new HandleStripeWebhookService(
        confirmUserPaymentService,
        createSubscriptionService,
        renewSubscriptionService,
        cancelSubscriptionService,
        createPaymentService
      );

      try {
        const signature = request.headers['stripe-signature'];

        if (!signature || typeof signature !== 'string') {
          return reply
            .status(400)
            .send({ message: 'Missing signature header' });
        }

        if (!request.rawBody) {
          return reply.status(400).send({ message: 'Missing raw payload' });
        }

        const event = await stripeProvider.verifyWebhookSignature(
          request.rawBody as Buffer,
          signature
        );

        if (event) {
          await handleStripeWebhookService.handle({ event });
        }

        return reply.status(200).send({ received: true });
      } catch (error) {
        request.log.error(error);
        return reply.status(400).send({ message: 'Invalid webhook payload' });
      }
    }
  );
};
