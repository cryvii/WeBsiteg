import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { commissions } from '../src/lib/server/db/schema';
import { sql } from 'drizzle-orm';

const DATABASE_URL = process.env.DATABASE_URL || 'postgres://vibhu@localhost:5432/bunker';

async function resetDatabase() {
    const client = postgres(DATABASE_URL);
    const db = drizzle(client);

    console.log('🗑️  Resetting database...');

    // Delete all commissions
    await db.delete(commissions);

    console.log('✅ All commissions deleted');

    // Reset the auto-increment sequence
    await client`ALTER SEQUENCE commissions_id_seq RESTART WITH 1`;

    console.log('✅ ID sequence reset');
    console.log('🎉 Database reset complete!');

    await client.end();
}

resetDatabase().catch(console.error);
