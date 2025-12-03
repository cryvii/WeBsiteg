import { defineConfig } from 'drizzle-kit';

export default defineConfig({
    schema: './src/lib/server/db/schema.ts',
    out: './drizzle',
    dialect: 'postgresql',
    dbCredentials: {
        url: process.env.DATABASE_URL || 'postgres://user:password@localhost:5432/bunker',
    },
    verbose: true,
    strict: true,
});
