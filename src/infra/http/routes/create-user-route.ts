import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { ZodError, z } from 'zod';
import { UserRole } from '@/core/entities/user';
import { CreateUserService } from '@/core/services/create-user-service';
import { ErrorUserAlreadyExists } from '@/core/services/errors/user-already-exist';
import { DrizzleUserRepository } from '@/infra/db/repositories/drizzle-user-repository';

export const createUserRoute: FastifyPluginAsyncZod = async (app) => {
  app.post(
    '/api/user',
    {
      schema: {
        summary: 'Create a new user',
        operationId: 'createUser',
        tags: ['User'],
        description: 'Create a new user',
        body: z.object({
          name: z.string(),
          email: z.email(),
          password: z.string().min(8),
          role: z.enum(['professional', 'patient']).default('professional'),
        }),
        response: {
          201: z.null(),
          400: z.object({
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
      const drizzleRepository = new DrizzleUserRepository();
      const createUserService = new CreateUserService(drizzleRepository);

      const { name, email, password, role } = request.body;

      try {
        const domainRole =
          role === 'professional' ? UserRole.Professional : UserRole.Patient;

        const result = await createUserService.handle({
          name,
          email,
          password,
          role: domainRole,
        });

        if (result.isLeft()) {
          const error = result.value;

          const statusCode =
            error instanceof ErrorUserAlreadyExists ? 409 : 400;

          return reply.status(statusCode).send({ message: error.message });
        }

        return reply.status(201).send();
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
