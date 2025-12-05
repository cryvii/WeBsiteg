import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { commissions } from '../src/lib/server/db/schema';

const dbUrl = 'postgres://user:password@localhost:5432/bunker';
const client = postgres(dbUrl, { ssl: false });
const db = drizzle(client);

async function seed() {
    console.log('Clearing all commissions...');
    await db.delete(commissions);

    console.log('Adding 2 overlapping commissions for December 2025...');

    // Helper for December 2025 (current month)
    const dec2025 = (day: number, hour = 12) => new Date(2025, 11, day, hour, 0, 0);

    const testCommissions = [
        {
            client_name: 'Alice Johnson',
            email: 'alice@example.com',
            description: 'Portrait commission - realistic style',
            price: 150,
            status: 'approved' as const,
            created_at: dec2025(5),           // Dec 5: request received
            accepted_at: dec2025(6),          // Dec 6: accepted
            completion_date: dec2025(15),     // Dec 15: due
            scheduled_at: dec2025(10),        // Dec 10: scheduled work
        },
        {
            client_name: 'Bob Smith',
            email: 'bob@example.com',
            description: 'Character design for game',
            price: 300,
            status: 'approved' as const,
            created_at: dec2025(5),           // Dec 5: request received (OVERLAPS with Alice)
            accepted_at: dec2025(7),          // Dec 7: accepted
            completion_date: dec2025(15),     // Dec 15: due (OVERLAPS with Alice)
            scheduled_at: dec2025(10),        // Dec 10: scheduled work (OVERLAPS with Alice)
        },
    ];

    for (const commission of testCommissions) {
        await db.insert(commissions).values(commission);
    }

    console.log('✓ Seeded 2 overlapping commissions for December 2025');
    console.log('Overlapping dates:');
    console.log('- Dec 5: Both requests received (2 events)');
    console.log('- Dec 10: Both scheduled (2 events)');
    console.log('- Dec 15: Both due (2 events)');

    await client.end();
    process.exit(0);
}

seed().catch((err) => {
    console.error('Seeding failed:', err);
    process.exit(1);
});
