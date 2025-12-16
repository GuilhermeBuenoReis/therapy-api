import { betterAuth } from 'better-auth';
import { env } from '../../env';

export const auth = betterAuth({
  database: {
    provider: 'postgres',
    url: env.DATABASE_URL,
  },
  trustedOrigins: [env.CLIENT_ORIGIN],
});
