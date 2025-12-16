import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { FindUserByIdService } from '@/core/services/find-user-by-id-service';
import { DrizzleUserRepository } from '@/infra/db/repositories/drizzle-user-repository';
import { betterAuthGuard } from '../hooks/better-auth-guard-hook';

export const findUserByIdRoute: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/api/user/id',
    {
      onRequest: [betterAuthGuard],
      schema: {
        summary: 'Find user by id',
        operationId: 'findUserById',
        tags: ['User'],
        response: {
          200: z.object({
            id: z.uuid(),
            name: z.string(),
            email: z.email(),
            role: z.enum(['professional', 'patient']),
            paymentConfirmedAt: z.iso.datetime().nullable(),
            createdAt: z.iso.datetime(),
            updatedAt: z.iso.datetime().nullable(),
          }),
          401: z.object({
            message: z.string(),
          }),
          404: z.object({
            message: z.string(),
          }),
          500: z.object({
            message: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      const userRepository = new DrizzleUserRepository();
      const findUserByIdService = new FindUserByIdService(userRepository);

      try {
        const userId = request.sub.userId;

        const result = await findUserByIdService.handle({ userId });

        if (result.isLeft()) {
          const error = result.value;
          return reply.status(404).send({ message: error.message });
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
