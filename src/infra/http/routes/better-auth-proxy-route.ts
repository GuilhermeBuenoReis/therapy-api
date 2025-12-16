import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { env } from '../../env';
import { auth } from '../lib/better-auth';

export const betterAuthProxyRoute: FastifyPluginAsyncZod = async (app) => {
  app.route({
    method: ['GET', 'POST'],
    url: '/api/auth/*',
    async handler(request, reply) {
      try {
        const protocol =
          (request.headers['x-forwarded-proto'] as string | undefined) ??
          'http';
        const host = request.headers.host ?? `localhost:${env.PORT}`;
        const url = new URL(request.url, `${protocol}://${host}`);

        const headers = new Headers();
        for (const [key, value] of Object.entries(request.headers)) {
          if (!value) {
            continue;
          }

          if (Array.isArray(value)) {
            value.forEach((item) => headers.append(key, item));
          } else {
            headers.append(key, value.toString());
          }
        }

        const method = request.method ?? 'GET';
        const bodyAllowed = !['GET', 'HEAD'].includes(method.toUpperCase());
        let body: string | undefined;

        if (bodyAllowed && request.body) {
          if (typeof request.body === 'string') {
            body = request.body;
          } else if (Buffer.isBuffer(request.body)) {
            body = request.body.toString();
          } else {
            body = JSON.stringify(request.body);
          }
        }

        const authRequest = new Request(url.toString(), {
          method,
          headers,
          body,
        });

        const response = await auth.handler(authRequest);
        const responseText = await response.text();

        response.headers.forEach((value, key) => reply.header(key, value));

        return reply
          .status(response.status)
          .send(responseText.length > 0 ? responseText : null);
      } catch (error) {
        request.log.error({ err: error }, 'Authentication handler failure');
        return reply.status(500).send({
          error: 'Internal authentication error',
          code: 'AUTH_FAILURE',
        });
      }
    },
  });
};
