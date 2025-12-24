import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { ErrorPatientNotFound } from '@/core/services/errors/patient-not-found';
import { ErrorPatientNotLinkedToProfessional } from '@/core/services/errors/patient-not-linked-to-a-professional';
import { FindPatientForProfessionalService } from '@/core/services/find-patient-for-professional-service';
import { VerifyProfessionalHasAccessToPatient } from '@/core/services/rules/verify-professional-has-access-to-patient';
import { DrizzlePatientRepository } from '@/infra/db/repositories/drizzle-patient-repository';
import { PatientPresenter } from '@/infra/http/presenters/patient-presenter';
import { betterAuthGuard } from '../hooks/better-auth-guard-hook';

export const findPatientByIdRoute: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/api/patients/:patientId',
    {
      onRequest: [betterAuthGuard],
      schema: {
        summary: 'Find a patient by id',
        operationId: 'findPatientById',
        tags: ['Patients'],
        params: z.object({
          patientId: z.string().uuid(),
        }),
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
      const verifyAccess = new VerifyProfessionalHasAccessToPatient(
        patientRepository
      );
      const findPatientByProfessionalIdService =
        new FindPatientForProfessionalService(patientRepository, verifyAccess);

      const sendErrorResponse = (error: unknown) => {
        switch (true) {
          case error instanceof ErrorPatientNotFound:
            return reply.status(404).send({ message: (error as Error).message });
          case error instanceof ErrorPatientNotLinkedToProfessional:
            return reply.status(403).send({ message: (error as Error).message });
          default: {
            const fallback =
              error instanceof Error
                ? error.message
                : 'Unable to fetch patient.';

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
            .send({ message: 'Only professionals can access patients.' });
        }

        const { patientId } = request.params;

        const result = await findPatientByProfessionalIdService.handle({
          patientId,
          professionalId,
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
