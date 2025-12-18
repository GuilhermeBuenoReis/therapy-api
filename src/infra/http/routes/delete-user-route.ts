import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { DeleteUserService } from '@/core/services/delete-user-service';
import { ErrorUserNotFound } from '@/core/services/errors/user-not-found';
import { DrizzleUserRepository } from '@/infra/db/repositories/drizzle-user-repository';
import { betterAuthGuard } from '../hooks/better-auth-guard-hook';

export const deleteUserRoute: FastifyPluginAsyncZod = async (app) => {
  app.delete(
    '/api/user/delete/',
    {
      onRequest: [betterAuthGuard],
      schema: {
        summary: 'Delete user by id',
        operationId: 'deleteUser',
        tags: ['User'],
        response: {
          204: z.null(),
          401: z.object({
            message: z.string(),
          }),
          400: z.object({
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
      const userId = request.sub.userId;
      const userRepository = new DrizzleUserRepository();
      const deleteUserService = new DeleteUserService(userRepository);

      try {
        const result = await deleteUserService.handle({ userId });

        if (result.isLeft()) {
          const error = result.value;
          if (error instanceof ErrorUserNotFound) {
            return reply.status(404).send({ message: error.message });
          }

          return reply.status(500).send({ message: 'Unable to delete user' });
        }

        return reply.status(204).send();
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ message: 'Internal server error' });
      }
    }
  );
};
