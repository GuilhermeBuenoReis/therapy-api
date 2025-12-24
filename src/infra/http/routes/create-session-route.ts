import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { SessionStatus } from '@/core/entities/session';
import { CheckSubscriptionStatusService } from '@/core/services/check-subscription-status-service';
import { CreateSessionService } from '@/core/services/create-session-service';
import { ErrorSessionConflictForPatient } from '@/core/services/errors/error-session-conflict-for-patient';
import { ErrorSessionConflictForProfessional } from '@/core/services/errors/error-session-conflict-for-professional';
import { ErrorSubscriptionAccessBlocked } from '@/core/services/errors/error-subscription-access-blocked';
import { ErrorSubscriptionNotFound } from '@/core/services/errors/error-subscription-not-found';
import { ErrorSubscriptionReadOnly } from '@/core/services/errors/error-subscription-read-only';
import { ErrorPatientNotFound } from '@/core/services/errors/patient-not-found';
import { ErrorPatientNotLinkedToProfessional } from '@/core/services/errors/patient-not-linked-to-a-professional';
import { ProfessionalNotFoundError } from '@/core/services/errors/professional-not-found-error';
import { CheckSubscriptionStatusMiddleware } from '@/core/services/rules/check-subscription-status-middleware';
import { DrizzlePatientRepository } from '@/infra/db/repositories/drizzle-patient-repository';
import { DrizzleProfessionalRepository } from '@/infra/db/repositories/drizzle-professional-repository';
import { DrizzleSessionRepository } from '@/infra/db/repositories/drizzle-session-repository';
import { DrizzleSubscriptionRepository } from '@/infra/db/repositories/drizzle-subscription-repository';
import { SessionPresenter } from '@/infra/http/presenters/session-presenter';
import { betterAuthGuard } from '../hooks/better-auth-guard-hook';

export const createSessionRoute: FastifyPluginAsyncZod = async (app) => {
  app.post(
    '/api/patients/:patientId/sessions',
    {
      onRequest: [betterAuthGuard],
      schema: {
        summary: 'Create a session for a patient',
        operationId: 'createSession',
        tags: ['Sessions'],
        params: z.object({
          patientId: z.uuid(),
        }),
        body: z.object({
          sessionDate: z.iso.datetime(),
          price: z.number().positive().optional(),
          durationMinutes: z.number().positive().optional(),
          notes: z.string().max(20_000).optional(),
        }),
        response: {
          201: z.object({
            session: z.object({
              id: z.uuid(),
              patientId: z.uuid(),
              professionalId: z.uuid(),
              price: z.number(),
              notes: z.string(),
              sessionDate: z.iso.datetime(),
              status: z.enum([
                SessionStatus.scheduled,
                SessionStatus.inProgress,
                SessionStatus.completed,
                SessionStatus.canceled,
              ]),
              durationMinutes: z.number(),
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
      const sessionRepository = new DrizzleSessionRepository();
      const patientRepository = new DrizzlePatientRepository();
      const professionalRepository = new DrizzleProfessionalRepository();
      const subscriptionRepository = new DrizzleSubscriptionRepository();

      const checkSubscriptionStatusService = new CheckSubscriptionStatusService(
        subscriptionRepository
      );

      const subscriptionMiddleware = new CheckSubscriptionStatusMiddleware(
        checkSubscriptionStatusService
      );

      const createSessionService = new CreateSessionService(
        sessionRepository,
        patientRepository,
        professionalRepository,
        subscriptionMiddleware
      );

      const sendErrorResponse = (error: unknown) => {
        switch (true) {
          case error instanceof ErrorPatientNotFound:
          case error instanceof ProfessionalNotFoundError:
            return reply.status(404).send({ message: (error as Error).message });
          case error instanceof ErrorPatientNotLinkedToProfessional:
            return reply.status(403).send({ message: (error as Error).message });
          case
            error instanceof ErrorSessionConflictForProfessional ||
            error instanceof ErrorSessionConflictForPatient:
            return reply.status(400).send({ message: (error as Error).message });
          case
            error instanceof ErrorSubscriptionAccessBlocked ||
            error instanceof ErrorSubscriptionReadOnly:
            return reply.status(403).send({ message: (error as Error).message });
          case error instanceof ErrorSubscriptionNotFound:
            return reply.status(404).send({ message: (error as Error).message });
          default: {
            const fallback =
              error instanceof Error
                ? error.message
                : 'Unable to create session.';

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
            .send({ message: 'Only professionals can create sessions.' });
        }

        const { patientId } = request.params;
        const { sessionDate, price, durationMinutes, notes } = request.body;

        const result = await createSessionService.handle({
          patientId,
          professionalId,
          sessionDate: new Date(sessionDate),
          price,
          durationMinutes,
          notes: notes ?? '',
        });

        if (result.isLeft()) {
          return sendErrorResponse(result.value);
        }

        const { session } = result.value;

        return reply
          .status(201)
          .send({ session: SessionPresenter.toHTTP(session) });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ message: 'Internal server error' });
      }
    }
  );
};
