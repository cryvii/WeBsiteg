import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db';
import { users, settings, commissions } from '$lib/server/db/schema';
import { eq, desc } from 'drizzle-orm';

// Simple in-memory session for demo (In prod, use a cookie/JWT library)
// For this architecture, we'll use a simple cookie check against a hardcoded hash or DB hash.
// NOTE: For a real app, use `lucia` or `bcrypt`. Here we simulate a hash check.

export const load: PageServerLoad = async ({ cookies }) => {
    const user = cookies.get('session_user');

    // Fetch Settings
    let setting = await db.select().from(settings).limit(1);
    if (setting.length === 0) {
        await db.insert(settings).values({ is_commissions_open: true });
        setting = await db.select().from(settings).limit(1);
    }

    // Fetch Commissions
    const pendingCommissions = await db.select().from(commissions).where(eq(commissions.status, 'pending')).orderBy(desc(commissions.created_at));

    return {
        user,
        settings: setting[0],
        pendingCount: pendingCommissions.length,
        commissions: pendingCommissions
    };
};

export const actions: Actions = {
    login: async ({ cookies, request }) => {
        const data = await request.formData();
        const username = data.get('username');
        const password = data.get('password');

        // Hardcoded for demo - in prod, query `users` table
        if (username === 'admin' && password === 'bunker123') {
            cookies.set('session_user', 'admin', { path: '/' });
            return { success: true };
        }

        return fail(400, { error: 'Invalid credentials' });
    },

    toggle: async ({ }) => {
        const setting = await db.select().from(settings).limit(1);
        const current = setting[0].is_commissions_open;
        await db.update(settings).set({ is_commissions_open: !current }).where(eq(settings.id, true));
    },

    reject: async ({ request }) => {
        const data = await request.formData();
        const id = data.get('id');
        if (id) {
            await db.update(commissions).set({ status: 'rejected' }).where(eq(commissions.id, Number(id)));
        }
    }
};
