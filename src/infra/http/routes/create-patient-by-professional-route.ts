import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { CreatePatientByProfessionalService } from '@/core/services/create-patient-by-professional-service';
import { ProfessionalNotFoundError } from '@/core/services/errors/professional-not-found-error';
import { ErrorUserNotFound } from '@/core/services/errors/user-not-found';
import { DrizzlePatientRepository } from '@/infra/db/repositories/drizzle-patient-repository';
import { DrizzleProfessionalRepository } from '@/infra/db/repositories/drizzle-professional-repository';
import { DrizzleUserRepository } from '@/infra/db/repositories/drizzle-user-repository';
import { PatientPresenter } from '@/infra/http/presenters/patient-presenter';
import { betterAuthGuard } from '../hooks/better-auth-guard-hook';

export const createPatientByProfessionalRoute: FastifyPluginAsyncZod = async (
  app
) => {
  app.post(
    '/api/professionals/patients',
    {
      onRequest: [betterAuthGuard],
      schema: {
        summary: 'Create a patient linked to the authenticated professional',
        operationId: 'createPatientByProfessional',
        tags: ['Patients'],
        body: z.object({
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
      const userRepository = new DrizzleUserRepository();
      const professionalRepository = new DrizzleProfessionalRepository();

      const createPatientByProfessionalService =
        new CreatePatientByProfessionalService(
          patientRepository,
          userRepository,
          professionalRepository
        );

      const sendErrorResponse = (error: unknown) => {
        if (error instanceof ErrorUserNotFound) {
          return reply.status(404).send({ message: error.message });
        }

        if (error instanceof ProfessionalNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }

        const fallback =
          error instanceof Error ? error.message : 'Unable to create patient.';

        return reply.status(400).send({ message: fallback });
      };

      try {
        const role = request.sub.role;
        const userId = request.sub.userId;

        if (role !== 'professional') {
          return reply
            .status(403)
            .send({ message: 'Only professionals can create patients.' });
        }

        const { name, birthDate, phone, note } = request.body;

        const result = await createPatientByProfessionalService.handle({
          professionalId: userId,
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
