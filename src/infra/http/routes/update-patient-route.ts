import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { CheckSubscriptionStatusService } from '@/core/services/check-subscription-status-service';
import { EditPatientService } from '@/core/services/edit-patient-service';
import { ErrorSubscriptionAccessBlocked } from '@/core/services/errors/error-subscription-access-blocked';
import { ErrorSubscriptionNotFound } from '@/core/services/errors/error-subscription-not-found';
import { ErrorSubscriptionReadOnly } from '@/core/services/errors/error-subscription-read-only';
import { ErrorPatientNotFound } from '@/core/services/errors/patient-not-found';
import { CheckSubscriptionStatusMiddleware } from '@/core/services/rules/check-subscription-status-middleware';
import { DrizzlePatientRepository } from '@/infra/db/repositories/drizzle-patient-repository';
import { DrizzleSubscriptionRepository } from '@/infra/db/repositories/drizzle-subscription-repository';
import { PatientPresenter } from '@/infra/http/presenters/patient-presenter';
import { betterAuthGuard } from '../hooks/better-auth-guard-hook';

export const updatePatientRoute: FastifyPluginAsyncZod = async (app) => {
  app.put(
    '/api/patients/:patientId',
    {
      onRequest: [betterAuthGuard],
      schema: {
        summary: 'Update a patient profile',
        operationId: 'updatePatient',
        tags: ['Patients'],
        params: z.object({
          patientId: z.string().uuid(),
        }),
        body: z.object({
          name: z.string().min(1),
          birthDate: z.string().min(1),
          phone: z.string().min(1),
          note: z.string().max(20_000).optional(),
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
              createdAt: z.string().datetime(),
              updatedAt: z.string().datetime().nullable(),
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
      const subscriptionRepository = new DrizzleSubscriptionRepository();
      const checkSubscriptionStatusService = new CheckSubscriptionStatusService(
        subscriptionRepository
      );
      const subscriptionMiddleware = new CheckSubscriptionStatusMiddleware(
        checkSubscriptionStatusService
      );

      const editPatientService = new EditPatientService(
        patientRepository,
        subscriptionMiddleware
      );

      const sendErrorResponse = (error: unknown) => {
        switch (true) {
          case error instanceof ErrorPatientNotFound:
            return reply.status(404).send({ message: (error as Error).message });
          case
            error instanceof ErrorSubscriptionAccessBlocked ||
            error instanceof ErrorSubscriptionReadOnly:
            return reply.status(403).send({ message: (error as Error).message });
          case error instanceof ErrorSubscriptionNotFound:
            return reply.status(404).send({ message: (error as Error).message });
          default: {
            const fallbackMessage =
              error instanceof Error
                ? error.message
                : 'Unable to update patient.';

            return reply.status(400).send({ message: fallbackMessage });
          }
        }
      };

      try {
        const professionalId = request.sub.professionalId;
        const role = request.sub.role;

        if (!professionalId || role !== 'professional') {
          return reply
            .status(403)
            .send({ message: 'Only professionals can update patients.' });
        }

        const { patientId } = request.params;
        const { name, birthDate, phone, note } = request.body;

        const result = await editPatientService.handle({
          professionalId,
          patientId,
          name,
          birthDate,
          phone,
          note: note ?? '',
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
