import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { ZodError, z } from 'zod';
import { UserRole } from '@/core/entities/user';
import { EditUserService } from '@/core/services/edit-user-service';
import { ErrorUserAlreadyExists } from '@/core/services/errors/user-already-exist';
import { ErrorUserNotFound } from '@/core/services/errors/user-not-found';
import { BcryptHasher } from '@/infra/cryptography/bcrypt-hasher';
import { DrizzleUserRepository } from '@/infra/db/repositories/drizzle-user-repository';
import { betterAuthGuard } from '../hooks/better-auth-guard-hook';

export const updateUserRoute: FastifyPluginAsyncZod = async (app) => {
  app.put(
    '/api/user/update/',
    {
      onRequest: [betterAuthGuard],
      schema: {
        summary: 'Update a user',
        operationId: 'updateUser',
        tags: ['User'],

        body: z
          .object({
            name: z.string().optional(),
            email: z.string().email().optional(),
            password: z.string().min(8).optional(),
            role: z.enum(['professional', 'patient']).optional(),
          })
          .refine(
            (payload) =>
              payload.name || payload.email || payload.password || payload.role,
            {
              message: 'At least one field must be provided.',
            }
          ),
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
          401: z.object({
            message: z.string(),
          }),
          400: z.object({
            message: z.string(),
          }),
          404: z.object({
            message: z.string(),
          }),
          409: z.object({
            message: z.string(),
          }),
          500: z.object({
            message: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      try {
        const userId = request.sub.userId;

        const userRepository = new DrizzleUserRepository();
        const hasher = new BcryptHasher();
        const editUserService = new EditUserService(userRepository, hasher);

        const { name, email, password, role } = request.body;

        const domainRole = role
          ? role === 'professional'
            ? UserRole.Professional
            : UserRole.Patient
          : undefined;

        const result = await editUserService.handle({
          userId,
          name,
          email,
          password,
          role: domainRole,
        });

        if (result.isLeft()) {
          const error = result.value;

          if (error instanceof ErrorUserNotFound) {
            return reply.status(404).send({ message: error.message });
          }

          if (error instanceof ErrorUserAlreadyExists) {
            return reply.status(409).send({ message: error.message });
          }

          return reply
            .status(500)
            .send({ message: (error as Error).message ?? 'Unexpected error' });
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
        if (error instanceof ZodError) {
          const message = error.issues.map((issue) => issue.message).join(', ');
          return reply.status(400).send({ message });
        }

        request.log.error(error);
        return reply.status(500).send({ message: 'Internal server error' });
      }
    }
  );
};
