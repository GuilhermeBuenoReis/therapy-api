import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { ErrorPatientNotFound } from '@/core/services/errors/patient-not-found';
import { ErrorUserNotFound } from '@/core/services/errors/user-not-found';
import { FindPatientByUserIdService } from '@/core/services/find-patient-by-user-id-service';
import { DrizzlePatientRepository } from '@/infra/db/repositories/drizzle-patient-repository';
import { DrizzleUserRepository } from '@/infra/db/repositories/drizzle-user-repository';
import { PatientPresenter } from '@/infra/http/presenters/patient-presenter';
import { betterAuthGuard } from '../hooks/better-auth-guard-hook';

export const findPatientByUserRoute: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/api/patients/me',
    {
      onRequest: [betterAuthGuard],
      schema: {
        summary: 'Get patient profile linked to the authenticated user',
        operationId: 'findPatientByUser',
        tags: ['Patients'],
        response: {
          200: z.object({
            patient: z.object({
              id: z.string().uuid(),
              userId: z.string().uuid(),
              professionalId: z.string().uuid(),
              name: z.string(),
              birthDate: z.string(),
              phone: z.string(),
              note: z.string().nullable(),
              createdAt: z.iso.datetime(),
              updatedAt: z.iso.datetime().nullable(),
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
      const patientRepository = new DrizzlePatientRepository();
      const userRepository = new DrizzleUserRepository();
      const findPatientByUserIdService = new FindPatientByUserIdService(
        patientRepository,
        userRepository
      );

      const sendErrorResponse = (error: unknown) => {
        switch (true) {
          case error instanceof ErrorUserNotFound:
          case error instanceof ErrorPatientNotFound:
            return reply.status(404).send({ message: (error as Error).message });
          default: {
            const fallback =
              error instanceof Error ? error.message : 'Unable to fetch patient.';

            return reply.status(400).send({ message: fallback });
          }
        }
      };

      try {
        const role = request.sub.role;
        const userId = request.sub.userId;

        if (role !== 'patient') {
          return reply
            .status(403)
            .send({ message: 'Only patients can access this resource.' });
        }

        const result = await findPatientByUserIdService.handle({
          userId,
        });

        if (result.isLeft()) {
          return sendErrorResponse(result.value);
        }

        const { patient } = result.value;

        return reply
          .status(200)
          .send({ patient: PatientPresenter.toHTTP(patient) });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ message: 'Internal server error' });
      }
    }
  );
};
