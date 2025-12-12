import { env } from '@/infra/env';
import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  out: './drizzle',
  schema: './src/infra/db/schemas/',
  dialect: 'postgresql',
  dbCredentials: {
    url: env.DATABASE_URL,
  },
});