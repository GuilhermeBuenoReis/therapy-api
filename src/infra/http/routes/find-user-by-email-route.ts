import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { FindUserByEmailService } from '@/core/services/find-user-by-email-service';
import { UserMapper } from '@/infra/db/mappers/user-mapper';
import { DrizzleUserRepository } from '@/infra/db/repositories/drizzle-user-repository';

export const findUserByEmailRoute: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/api/user/email/:email',
    {
      schema: {
        summary: 'Find user by email',
        operationId: 'findUserByEmail',
        tags: ['User'],
        params: z.object({
          email: z.email(),
        }),
        response: {
          200: z.object({
            id: z.uuid(),
            name: z.string(),
            email: z.email(),
            password: z.string(),
            role: z.enum(['professional', 'patient']).default('professional'),
            paymentConfirmedAt: z.iso.datetime().nullable(),
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
      const findUserByEmailService = new FindUserByEmailService(userRepository);

      try {
        const { email } = request.params;
        const result = await findUserByEmailService.handle({ email });

        if (result.isLeft()) {
          const error = result.value;
          return reply.status(404).send({ message: error.message });
        }

        const { user } = result.value;
        const mappedUser = UserMapper.toDatabase(user);

        const userResponse = {
          id: mappedUser.id,
          name: mappedUser.name,
          email: mappedUser.email,
          password: mappedUser.password,
          role: mappedUser.role,
          paymentConfirmedAt: mappedUser.paymentConfirmedAt
            ? mappedUser.paymentConfirmedAt.toISOString()
            : null,
        };

        return reply.status(200).send(userResponse);
      } catch (err) {
        request.log.error(err);
        return reply.status(500).send({ message: 'Internal server error' });
      }
    }
  );
};
