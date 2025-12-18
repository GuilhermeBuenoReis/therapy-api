import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { CheckSubscriptionStatusService } from '@/core/services/check-subscription-status-service';
import { CreatePatientService } from '@/core/services/create-patient-service';
import { ErrorSubscriptionAccessBlocked } from '@/core/services/errors/error-subscription-access-blocked';
import { ErrorSubscriptionNotFound } from '@/core/services/errors/error-subscription-not-found';
import { ErrorSubscriptionReadOnly } from '@/core/services/errors/error-subscription-read-only';
import { ErrorPatientNotLinkedToProfessional } from '@/core/services/errors/patient-not-linked-to-a-professional';
import { ErrorUserNotFound } from '@/core/services/errors/user-not-found';
import { CheckSubscriptionStatusMiddleware } from '@/core/services/rules/check-subscription-status-middleware';
import { DrizzlePatientRepository } from '@/infra/db/repositories/drizzle-patient-repository';
import { DrizzleProfessionalRepository } from '@/infra/db/repositories/drizzle-professional-repository';
import { DrizzleSubscriptionRepository } from '@/infra/db/repositories/drizzle-subscription-repository';
import { DrizzleUserRepository } from '@/infra/db/repositories/drizzle-user-repository';
import { PatientPresenter } from '@/infra/http/presenters/patient-presenter';
import { betterAuthGuard } from '../hooks/better-auth-guard-hook';

export const createPatientRoute: FastifyPluginAsyncZod = async (app) => {
  app.post(
    '/api/patients',
    {
      onRequest: [betterAuthGuard],
      schema: {
        summary: 'Create a patient profile',
        operationId: 'createPatient',
        tags: ['Patients'],
        body: z.object({
          userId: z.string().uuid(),
          name: z.string().min(1),
          birthDate: z.string().min(1),
          phone: z.string().min(1),
          note: z.string().max(20_000).optional(),
        }),
        response: {
          201: z.object({
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
      const professionalRepository = new DrizzleProfessionalRepository();
      const subscriptionRepository = new DrizzleSubscriptionRepository();

      const checkSubscriptionStatusService = new CheckSubscriptionStatusService(
        subscriptionRepository
      );

      const subscriptionMiddleware = new CheckSubscriptionStatusMiddleware(
        checkSubscriptionStatusService
      );

      const createPatientService = new CreatePatientService(
        patientRepository,
        userRepository,
        professionalRepository,
        subscriptionMiddleware
      );

      const sendErrorResponse = (error: unknown) => {
        if (error instanceof ErrorUserNotFound) {
          return reply.status(404).send({ message: error.message });
        }

        if (error instanceof ErrorPatientNotLinkedToProfessional) {
          return reply.status(404).send({ message: error.message });
        }

        if (
          error instanceof ErrorSubscriptionAccessBlocked ||
          error instanceof ErrorSubscriptionReadOnly
        ) {
          return reply.status(403).send({ message: error.message });
        }

        if (error instanceof ErrorSubscriptionNotFound) {
          return reply.status(404).send({ message: error.message });
        }

        const fallbackMessage =
          error instanceof Error ? error.message : 'Unable to create patient.';

        return reply.status(400).send({ message: fallbackMessage });
      };

      try {
        const professionalId = request.sub.professionalId;
        const role = request.sub.role;

        if (!professionalId || role !== 'professional') {
          return reply
            .status(403)
            .send({ message: 'Only professionals can create patients.' });
        }

        const { userId, name, birthDate, phone, note } = request.body;

        const result = await createPatientService.handle({
          userId,
          professionalId,
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
          .status(201)
          .send({ patient: PatientPresenter.toHTTP(patient) });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ message: 'Internal server error' });
      }
    }
  );
};
