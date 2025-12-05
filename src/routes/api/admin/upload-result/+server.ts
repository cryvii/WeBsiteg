import { json } from '@sveltejs/kit';
import type { RequestEvent } from './$types';
import { writeFile, mkdir } from 'fs/promises';
import { db } from '$lib/server/db';
import { commissions } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import path from 'path';

function isAuthenticated(cookies: any) {
    const sessionId = cookies.get('admin_session');
    return !!sessionId;
}

export async function POST({ request, cookies }: RequestEvent) {
    if (!isAuthenticated(cookies)) {
        return json({ error: 'Not authenticated' }, { status: 401 });
    }

    try {
        const formData = await request.formData();
        const commissionId = formData.get('commission_id');
        const files = formData.getAll('images');

        if (!commissionId || !files.length) {
            return json({ error: 'Missing commission_id or images' }, { status: 400 });
        }

        // Get current commission
        const comm = await db.select().from(commissions).where(eq(commissions.id, Number(commissionId)));
        if (!comm.length) {
            return json({ error: 'Commission not found' }, { status: 404 });
        }

        // Create uploads/results directory if it doesn't exist
        const uploadDir = path.join(process.cwd(), 'static', 'uploads', 'results');
        await mkdir(uploadDir, { recursive: true });

        // Parse existing final results
        const existing = comm[0].final_result_images ? JSON.parse(comm[0].final_result_images as string) : [];
        const newUrls: string[] = [];

        // Save each uploaded file
        for (const file of files) {
            if (file instanceof File) {
                const timestamp = Date.now();
                const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
                const filename = `result_${commissionId}_${timestamp}_${sanitizedName}`;
                const filepath = path.join(uploadDir, filename);

                const buffer = Buffer.from(await file.arrayBuffer());
                await writeFile(filepath, buffer);

                newUrls.push(`/uploads/results/${filename}`);
            }
        }

        // Update commission with new result images (append to existing)
        const updated = [...existing, ...newUrls];
        await db.update(commissions)
            .set({ final_result_images: JSON.stringify(updated) })
            .where(eq(commissions.id, Number(commissionId)));

        return json({ success: true, urls: newUrls });
    } catch (err) {
        console.error('Error uploading result images:', err);
        return json({ error: 'Failed to upload images' }, { status: 500 });
    }
}

// DELETE individual result image
export async function DELETE({ request, cookies }: RequestEvent) {
    if (!isAuthenticated(cookies)) {
        return json({ error: 'Not authenticated' }, { status: 401 });
    }

    try {
        const { commission_id, image_url } = await request.json();

        // Get current commission
        const comm = await db.select().from(commissions).where(eq(commissions.id, commission_id));
        if (!comm.length) {
            return json({ error: 'Commission not found' }, { status: 404 });
        }

        // Parse and filter out the deleted image
        const existing = comm[0].final_result_images ? JSON.parse(comm[0].final_result_images as string) : [];
        const updated = existing.filter((url: string) => url !== image_url);

        // Update commission
        await db.update(commissions)
            .set({ final_result_images: JSON.stringify(updated) })
            .where(eq(commissions.id, commission_id));

        return json({ success: true });
    } catch (err) {
        console.error('Error deleting result image:', err);
        return json({ error: 'Failed to delete image' }, { status: 500 });
    }
}
