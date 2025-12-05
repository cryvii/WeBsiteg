import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { commissions } from '../src/lib/server/db/schema';
import { faker } from '@faker-js/faker';

const dbUrl = 'postgres://user:password@localhost:5432/bunker';
console.log('Using DB URL:', dbUrl.replace(/:[^:@]+@/, ':****@'));
const client = postgres(dbUrl, { ssl: false });
const db = drizzle(client);

async function seed() {
    console.log('Seeding commissions...');

    const statuses = ['pending', 'approved', 'rejected', 'paid', 'completed'] as const;

    for (let i = 0; i < 3; i++) {
        const status = faker.helpers.arrayElement(statuses);
        const createdAt = faker.date.past({ years: 0.5 });

        let acceptedAt = null;
        let completionDate = null;
        let scheduledAt = null;
        let rejectionReason = null;

        if (status !== 'pending' && status !== 'rejected') {
            acceptedAt = faker.date.between({ from: createdAt, to: new Date() });
            completionDate = faker.date.future({ years: 0.1, refDate: acceptedAt });

            if (Math.random() > 0.5) {
                scheduledAt = faker.date.between({ from: acceptedAt, to: completionDate });
            }
        } else if (status === 'rejected') {
            rejectionReason = faker.lorem.sentence();
        }

        await db.insert(commissions).values({
            client_name: faker.person.fullName(),
            email: faker.internet.email(),
            description: faker.lorem.paragraph(),
            price: faker.number.int({ min: 50, max: 500 }),
            status: status,
            rejection_reason: rejectionReason,
            accepted_at: acceptedAt,
            completion_date: completionDate,
            scheduled_at: scheduledAt,
            created_at: createdAt,
            reference_images: JSON.stringify([faker.image.url()]),
        });
    }

    console.log('Seeding complete!');
    process.exit(0);
}

seed().catch((err) => {
    console.error('Seeding failed:', err);
    process.exit(1);
});
