import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { env } from '../env';
import { schemas } from './schemas';

const pool = new Pool({
  connectionString: env.DATABASE_URL,
});

const connection = drizzle(pool, { schema: schemas });

export const db = Object.assign(connection, { schemas });
