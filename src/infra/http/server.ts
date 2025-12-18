import { randomUUID } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import fastifyCookie from '@fastify/cookie';
import { fastifyCors } from '@fastify/cors';
import { fastifySwagger } from '@fastify/swagger';
import scalar from '@scalar/fastify-api-reference';
import { fastify } from 'fastify';
import fastifyRawBody from 'fastify-raw-body';
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod';
import { env } from '../env/index';
import { authenticateProfessionalRoute } from './routes/authenticate-professional-route';
import { betterAuthProxyRoute } from './routes/better-auth-proxy-route';
import { createCheckoutSessionRoute } from './routes/create-checkout-session-route';
import { createPatientRoute } from './routes/create-patient-route';
import { createProfessionalRoute } from './routes/create-professional-route';
import { createUserRoute } from './routes/create-user-route';
import { deletePatientRoute } from './routes/delete-patient-route';
import { deleteProfessionalRoute } from './routes/delete-professional-route';
import { deleteUserRoute } from './routes/delete-user-route';
import { findPatientByIdRoute } from './routes/find-patient-by-id-route';
import { findPatientByUserRoute } from './routes/find-patient-by-user-route';
import { findProfessionalByIdRoute } from './routes/find-professional-by-id-route';
import { findProfessionalByUserRoute } from './routes/find-professional-by-user-route';
import { findUserByEmailRoute } from './routes/find-user-by-email-route';
import { findUserByIdRoute } from './routes/find-user-by-id-route';
import { healthRoutes } from './routes/health';
import { listPatientsByProfessionalRoute } from './routes/list-patients-by-professional-route';
import { stripeWebhookRoute } from './routes/stripe-webhook-route';
import { updatePatientRoute } from './routes/update-patient-route';
import { updateProfessionalRoute } from './routes/update-professional-route';
import { updateUserRoute } from './routes/update-user-route';

export const app = fastify().withTypeProvider<ZodTypeProvider>();

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

app.register(fastifySwagger, {
  openapi: {
    info: { title: 'MentalCare API', version: '1.0.0' },
    servers: [{ url: `http://localhost:${env.PORT}` }],
  },
  transform: jsonSchemaTransform,
});

app.register(fastifyCookie, {
  hook: 'onRequest',
});

app.register(fastifyCors, {
  origin: env.CLIENT_ORIGIN,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  maxAge: 86_400,
});

app.register(fastifyRawBody, {
  field: 'rawBody',
  global: false,
  encoding: false,
  runFirst: true,
});

app.register(scalar, {
  routePrefix: '/scalar',
  configuration: {
    theme: 'kepler',
  },
});

app.register(healthRoutes);
app.register(createUserRoute);
app.register(authenticateProfessionalRoute);
app.register(findUserByEmailRoute);
app.register(findUserByIdRoute);
app.register(updateUserRoute);
app.register(deleteUserRoute);
app.register(createProfessionalRoute);
app.register(createPatientRoute);
app.register(findProfessionalByIdRoute);
app.register(findProfessionalByUserRoute);
app.register(listPatientsByProfessionalRoute);
app.register(findPatientByUserRoute);
app.register(findPatientByIdRoute);
app.register(updateProfessionalRoute);
app.register(updatePatientRoute);
app.register(deleteProfessionalRoute);
app.register(deletePatientRoute);
app.register(createCheckoutSessionRoute);
app.register(stripeWebhookRoute);

app.register(betterAuthProxyRoute);

app.listen({ port: env.PORT, host: '0.0.0.0' }).then(() => {
  console.log(`Server is running on port ${env.PORT}`);
});

if (env.NODE_ENV === 'development') {
  const specFile = resolve(__dirname, '../../../swagger.json');
  app.ready().then(async () => {
    const spec = JSON.stringify(app.swagger(), null, 2);
    await writeFile(specFile, spec);
    console.log('Swagger spec generated!');
    console.log(randomUUID());
  });
}
