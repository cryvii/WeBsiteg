
import { json } from '@sveltejs/kit';
import type { RequestEvent } from './$types';
import { db } from '$lib/server/db';
import { commissions, settings } from '$lib/server/db/schema';
import { eq, sql } from 'drizzle-orm';

export async function POST({ request }: RequestEvent) {
    try {
        // 1. Check Global Switch
        const setting = await db.select().from(settings).limit(1);
        const currentSettings = setting[0] || { is_commissions_open: true, queue_limit: 200 }; // Default if DB empty

        if (!currentSettings.is_commissions_open) {
            return json({ error: 'Commissions are currently closed.' }, { status: 503 });
        }

        // 2. Safe Queue Check
        const pendingCountResult = await db
            .select({ count: sql`count(*)` })
            .from(commissions)
            .where(eq(commissions.status, 'pending'));

        const pendingCount = Number(pendingCountResult[0]?.count || 0);

        if (pendingCount >= currentSettings.queue_limit) {
            // Try to auto-close the gate, but don't let DB errors bubble to the client
            try {
                await db.update(settings).set({ is_commissions_open: false }).where(eq(settings.id, true));
            } catch (dbErr) {
                console.error('Failed to auto-close commissions:', dbErr);
            }

            return json({ error: 'Queue is full. Commissions have been auto-closed.' }, { status: 503 });
        }

        // 3. Insert Commission
        const data = await request.json();

        // Basic validation
        if (!data || !data.email || !data.description) {
            return json({ error: 'Missing required fields' }, { status: 400 });
        }

        await db.insert(commissions).values({
            client_name: data.name || 'Anonymous',
            email: data.email,
            description: data.description,
            reference_images: data.reference_images || '[]',
            status: 'pending'
        });

        return json({ success: true, message: 'Commission request received.' });
    } catch (err) {
        console.error('API /api/commission error:', err);
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        return json({ error: errorMessage }, { status: 500 });
    }
}
