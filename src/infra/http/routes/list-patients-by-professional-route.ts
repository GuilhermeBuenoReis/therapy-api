import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { ProfessionalNotFoundError } from '@/core/services/errors/professional-not-found-error';
import { ListPatientsByProfessionalService } from '@/core/services/list-patients-by-professional-service';
import { DrizzlePatientRepository } from '@/infra/db/repositories/drizzle-patient-repository';
import { DrizzleProfessionalRepository } from '@/infra/db/repositories/drizzle-professional-repository';
import { PatientPresenter } from '@/infra/http/presenters/patient-presenter';
import { betterAuthGuard } from '../hooks/better-auth-guard-hook';

export const listPatientsByProfessionalRoute: FastifyPluginAsyncZod = async (
  app
) => {
  app.get(
    '/api/patients',
    {
      onRequest: [betterAuthGuard],
      schema: {
        summary: 'List patients for the authenticated professional',
        operationId: 'listPatientsByProfessional',
        tags: ['Patients'],
        response: {
          200: z.object({
            patients: z.array(
              z.object({
                id: z.string().uuid(),
                userId: z.string().uuid(),
                professionalId: z.string().uuid(),
                name: z.string(),
                birthDate: z.string(),
                phone: z.string(),
                note: z.string().nullable(),
                createdAt: z.string().datetime(),
                updatedAt: z.string().datetime().nullable(),
              })
            ),
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
      const professionalRepository = new DrizzleProfessionalRepository();
      const getPatientByProfessionalsService =
        new ListPatientsByProfessionalService(
          professionalRepository,
          patientRepository
        );

      const sendErrorResponse = (error: unknown) => {
        if (error instanceof ProfessionalNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }

        const fallback =
          error instanceof Error ? error.message : 'Unable to fetch patients.';

        return reply.status(400).send({ message: fallback });
      };

      try {
        const professionalId = request.sub.professionalId;
        const role = request.sub.role;

        if (!professionalId || role !== 'professional') {
          return reply
            .status(403)
            .send({ message: 'Only professionals can list patients.' });
        }

        const result = await getPatientByProfessionalsService.handle({
          professionalId,
        });

        if (result.isLeft()) {
          return sendErrorResponse(result.value);
        }

        const { patient } = result.value;

        return reply.status(200).send({
          patients: patient.map((item) => PatientPresenter.toHTTP(item)),
        });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ message: 'Internal server error' });
      }
    }
  );
};
