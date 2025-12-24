import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { DeletePatientService } from '@/core/services/delete-patient-service';
import { ErrorPatientNotFound } from '@/core/services/errors/patient-not-found';
import { DrizzlePatientRepository } from '@/infra/db/repositories/drizzle-patient-repository';
import { betterAuthGuard } from '../hooks/better-auth-guard-hook';

export const deletePatientRoute: FastifyPluginAsyncZod = async (app) => {
  app.delete(
    '/api/patients/:patientId',
    {
      onRequest: [betterAuthGuard],
      schema: {
        summary: 'Delete a patient profile',
        operationId: 'deletePatient',
        tags: ['Patients'],
        params: z.object({
          patientId: z.string().uuid(),
        }),
        response: {
          204: z.null(),
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
      const deletePatientService = new DeletePatientService(patientRepository);

      const sendErrorResponse = (error: unknown) => {
        switch (true) {
          case error instanceof ErrorPatientNotFound:
            return reply.status(404).send({ message: (error as Error).message });
          default: {
            const fallback =
              error instanceof Error
                ? error.message
                : 'Unable to delete patient.';

            return reply.status(400).send({ message: fallback });
          }
        }
      };

      try {
        const professionalId = request.sub.professionalId;
        const role = request.sub.role;

        if (!professionalId || role !== 'professional') {
          return reply
            .status(403)
            .send({ message: 'Only professionals can delete patients.' });
        }

        const { patientId } = request.params;

        const result = await deletePatientService.handle({
          patientId,
        });

        if (result.isLeft()) {
          return sendErrorResponse(result.value);
        }

        return reply.status(204).send();
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ message: 'Internal server error' });
      }
    }
  );
};
