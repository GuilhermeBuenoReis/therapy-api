import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { MethodEnum, TypeEnum } from '@/core/entities/payment';
import { CreatePaymentService } from '@/core/services/create-payment-service';
import { DrizzlePaymentRepository } from '@/infra/db/repositories/drizzle-payment-repository';
import { PaymentPresenter } from '@/infra/http/presenters/payment-presenter';
import { betterAuthGuard } from '../hooks/better-auth-guard-hook';

export const createPaymentRoute: FastifyPluginAsyncZod = async (app) => {
  app.post(
    '/api/payments',
    {
      onRequest: [betterAuthGuard],
      schema: {
        summary: 'Register a payment for the authenticated professional',
        operationId: 'createPayment',
        tags: ['Payments'],
        body: z.object({
          subscriptionId: z.string().uuid().nullable().optional(),
          type: z.enum([
            TypeEnum.Subscription,
            TypeEnum.AddOn,
            TypeEnum.Other,
          ]),
          amount: z.number().positive(),
          paidAt: z.string().datetime(),
          method: z.enum([
            MethodEnum.Pix,
            MethodEnum.Cash,
            MethodEnum.Credit,
            MethodEnum.Debit,
          ]),
          notes: z.string().max(20_000).nullable().optional(),
        }),
        response: {
          201: z.object({
            payment: z.object({
              id: z.string().uuid(),
              professionalId: z.string().uuid(),
              subscriptionId: z.string().uuid().nullable(),
              type: z.enum([
                TypeEnum.Subscription,
                TypeEnum.AddOn,
                TypeEnum.Other,
              ]),
              amount: z.number(),
              paidAt: z.string().datetime(),
              method: z.enum([
                MethodEnum.Pix,
                MethodEnum.Cash,
                MethodEnum.Credit,
                MethodEnum.Debit,
              ]),
              notes: z.string().nullable(),
              createdAt: z.string().datetime(),
            }),
          }),
          400: z.object({ message: z.string() }),
          401: z.object({ message: z.string() }),
          403: z.object({ message: z.string() }),
          500: z.object({ message: z.string() }),
        },
      },
    },
    async (request, reply) => {
      const paymentRepository = new DrizzlePaymentRepository();
      const createPaymentService = new CreatePaymentService(paymentRepository);

      try {
        const professionalId = request.sub.professionalId;
        const role = request.sub.role;

        if (!professionalId || role !== 'professional') {
          return reply
            .status(403)
            .send({ message: 'Only professionals can register payments.' });
        }

        const { subscriptionId, type, amount, paidAt, method, notes } =
          request.body;

        const result = await createPaymentService.handle({
          professionalId,
          subscriptionId: subscriptionId ?? null,
          type,
          amount,
          paidAt: new Date(paidAt),
          method,
          notes: notes ?? null,
        });

        const { payment } = result.value;

        return reply
          .status(201)
          .send({ payment: PaymentPresenter.toHTTP(payment) });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ message: 'Internal server error' });
      }
    }
  );
};
