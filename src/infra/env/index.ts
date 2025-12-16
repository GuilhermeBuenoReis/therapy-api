import { z } from 'zod';

export const envSchema = z.object({
  PORT: z.coerce.number().default(3333),
  DATABASE_URL: z.string(),
  CLIENT_ORIGIN: z.string().default('http://localhost:3000'),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),

  SEED_PROFESSIONAL_NAME: z.string().default('Seed Professional'),
  SEED_PROFESSIONAL_EMAIL: z.email().default('pro.seeder@therapy.local'),
  SEED_PROFESSIONAL_PASSWORD: z.string().default('Therapy#2024'),
  SEED_PAYMENT_CONFIRMED_AT: z.string().default('2024-01-05T12:00:00.000Z'),

  SEED_PATIENT_NAME: z.string().default('Seed Patient'),
  SEED_PATIENT_EMAIL: z.email().default('patient.seeder@therapy.local'),
  SEED_PATIENT_PASSWORD: z.string().default('Therapy#2024'),
});

export const env = envSchema.parse(process.env);
