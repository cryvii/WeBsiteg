import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { commissions } from '../src/lib/server/db/schema';
import { sql } from 'drizzle-orm';

const dbUrl = 'postgres://user:password@localhost:5432/bunker';
console.log('Using DB URL:', dbUrl.replace(/:[^:@]+@/, ':****@'));
const client = postgres(dbUrl, { ssl: false });
const db = drizzle(client);

async function seed() {
    console.log('Clearing existing commissions...');
    await db.delete(commissions);

    console.log('Seeding 10 custom commissions for December 2025...');

    // Helper to create dates in December 2025
    const dec2025 = (day: number, hour = 12) => new Date(2025, 11, day, hour, 0, 0);

    const testCommissions = [
        {
            client_name: 'Alice Johnson',
            email: 'alice@example.com',
            description: 'Portrait commission - realistic style',
            price: 150,
            status: 'pending' as const,
            created_at: dec2025(1),
            accepted_at: null,
            completion_date: null,
            scheduled_at: null,
        },
        {
            client_name: 'Bob Smith',
            email: 'bob@example.com',
            description: 'Character design for game',
            price: 300,
            status: 'approved' as const,
            created_at: dec2025(2),
            accepted_at: dec2025(3),
            completion_date: dec2025(10),
            scheduled_at: dec2025(7),
        },
        {
            client_name: 'Carol White',
            email: 'carol@example.com',
            description: 'Landscape painting',
            price: 200,
            status: 'approved' as const,
            created_at: dec2025(4),
            accepted_at: dec2025(5),
            completion_date: dec2025(15),
            scheduled_at: dec2025(12),
        },
        {
            client_name: 'David Brown',
            email: 'david@example.com',
            description: 'Logo design for startup',
            price: 250,
            status: 'completed' as const,
            created_at: dec2025(5),
            accepted_at: dec2025(6),
            completion_date: dec2025(12),
            scheduled_at: dec2025(8),
        },
        {
            client_name: 'Emma Davis',
            email: 'emma@example.com',
            description: 'Book cover illustration',
            price: 400,
            status: 'approved' as const,
            created_at: dec2025(7),
            accepted_at: dec2025(8),
            completion_date: dec2025(20),
            scheduled_at: dec2025(15),
        },
        {
            client_name: 'Frank Miller',
            email: 'frank@example.com',
            description: 'Pet portrait - watercolor',
            price: 120,
            status: 'rejected' as const,
            created_at: dec2025(10),
            accepted_at: null,
            completion_date: null,
            scheduled_at: null,
            rejection_reason: 'Too busy with current workload',
        },
        {
            client_name: 'Grace Lee',
            email: 'grace@example.com',
            description: 'Website banner design',
            price: 180,
            status: 'approved' as const,
            created_at: dec2025(12),
            accepted_at: dec2025(13),
            completion_date: dec2025(25),
            scheduled_at: dec2025(20),
        },
        {
            client_name: 'Henry Wilson',
            email: 'henry@example.com',
            description: 'Character turnaround sheet',
            price: 350,
            status: 'paid' as const,
            created_at: dec2025(3),
            accepted_at: dec2025(4),
            completion_date: dec2025(11),
            scheduled_at: dec2025(7),
        },
        {
            client_name: 'Ivy Chen',
            email: 'ivy@example.com',
            description: 'Comic page illustration',
            price: 280,
            status: 'approved' as const,
            created_at: dec2025(14),
            accepted_at: dec2025(15),
            completion_date: dec2025(28),
            scheduled_at: dec2025(22),
        },
        {
            client_name: 'Jack Thompson',
            email: 'jack@example.com',
            description: 'Album cover art',
            price: 320,
            status: 'completed' as const,
            created_at: dec2025(6),
            accepted_at: dec2025(7),
            completion_date: dec2025(18),
            scheduled_at: dec2025(14),
        },
    ];

    for (const commission of testCommissions) {
        await db.insert(commissions).values(commission);
    }

    console.log('✓ Seeded 10 custom commissions');
    console.log('Expected calendar markers:');
    console.log('- Pending (1): Dec 1 (request received)');
    console.log('- Approved (5): Multiple dates with request/accepted/due markers');
    console.log('- Completed (2): Dec 5, Dec 6 (requests), Dec 12, Dec 18 (completions)');
    console.log('- Rejected (1): Dec 10 (request received only)');
    console.log('- Paid (1): Should NOT appear on calendar');

    await client.end();
    process.exit(0);
}

seed().catch((err) => {
    console.error('Seeding failed:', err);
    process.exit(1);
});
