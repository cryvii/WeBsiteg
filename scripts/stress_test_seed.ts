import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { commissions } from '../src/lib/server/db/schema';

const DATABASE_URL = process.env.DATABASE_URL || 'postgres://vibhu@localhost:5432/bunker';

async function seedStressTest() {
    const client = postgres(DATABASE_URL);
    const db = drizzle(client);

    console.log('🌱 Starting stress test seed with 200+ commissions...');

    const statuses = ['pending', 'approved', 'completed', 'rejected', 'paid'];
    const names = [
        'Alice Smith', 'Bob Johnson', 'Carol White', 'David Brown', 'Eve Davis',
        'Frank Miller', 'Grace Wilson', 'Henry Moore', 'Ivy Taylor', 'Jack Anderson',
        'Kate Thomas', 'Leo Jackson', 'Mia Martin', 'Noah Lee', 'Olivia Harris',
        'Paul Clark', 'Quinn Lewis', 'Rose Walker', 'Sam Hall', 'Tina Allen'
    ];

    const descriptions = [
        'Character portrait with fantasy background',
        'Landscape painting of mountains at sunset',
        'Abstract geometric design',
        'Pet portrait of my cat',
        'Family portrait illustration',
        'Logo design for startup',
        'Book cover illustration',
        'Album artwork',
        'Detailed cityscape',
        'Nature scene with waterfall'
    ];

    const commissionsToCreate = [];
    const now = new Date();

    for (let i = 0; i < 220; i++) {
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const createdDaysAgo = Math.floor(Math.random() * 60); // 0-60 days ago
        const createdAt = new Date(now);
        createdAt.setDate(createdAt.getDate() - createdDaysAgo);

        let acceptedAt = null;
        let completionDate = null;

        if (status !== 'pending' && status !== 'rejected') {
            acceptedAt = new Date(createdAt);
            acceptedAt.setDate(acceptedAt.getDate() + Math.floor(Math.random() * 3) + 1);

            completionDate = new Date(acceptedAt);
            completionDate.setDate(completionDate.getDate() + Math.floor(Math.random() * 20) + 5);
        }

        const name = names[Math.floor(Math.random() * names.length)];
        const desc = descriptions[Math.floor(Math.random() * descriptions.length)];

        commissionsToCreate.push({
            client_name: `${name} ${i + 1}`,
            email: `client${i + 1}@test.com`,
            description: `Commission #${i + 1}: ${desc}`,
            price: Math.floor(Math.random() * 500) + 50,
            status: status as any,
            rejection_reason: status === 'rejected' ? 'Not accepting this type of work at the moment' : null,
            accepted_at: acceptedAt,
            completion_date: completionDate,
            scheduled_at: null,
            reference_images: '[]',
            created_at: createdAt
        });
    }

    // Insert in batches for better performance
    const batchSize = 50;
    for (let i = 0; i < commissionsToCreate.length; i += batchSize) {
        const batch = commissionsToCreate.slice(i, i + batchSize);
        await db.insert(commissions).values(batch);
        console.log(`✅ Inserted batch ${Math.floor(i / batchSize) + 1} (${batch.length} commissions)`);
    }

    console.log(`🎉 Successfully seeded ${commissionsToCreate.length} commissions!`);

    // Show breakdown
    const breakdown = commissionsToCreate.reduce((acc, c) => {
        acc[c.status] = (acc[c.status] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    console.log('\n📊 Status Breakdown:');
    Object.entries(breakdown).forEach(([status, count]) => {
        console.log(`  ${status}: ${count}`);
    });

    await client.end();
}

seedStressTest().catch(console.error);
