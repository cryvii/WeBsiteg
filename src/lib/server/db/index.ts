import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { env } from '$env/dynamic/private';

const client = postgres(env.DATABASE_URL || 'postgres://user:password@db:5432/bunker');
export const db = drizzle(client, { schema });
