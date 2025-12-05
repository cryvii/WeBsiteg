import { json } from '@sveltejs/kit';
import type { RequestEvent } from './$types';
import { db } from '$lib/server/db';
import { commissions } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { sendAcceptanceEmail, sendRejectionEmail } from '$lib/server/email';

function isAuthenticated(cookies: any) {
  const sessionId = cookies.get('admin_session');
  return !!sessionId;
}

// GET all commissions
export async function GET({ cookies }: RequestEvent) {
  if (!isAuthenticated(cookies)) {
    return json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const allCommissions = await db.select().from(commissions).orderBy(commissions.created_at);
    return json(allCommissions);
  } catch (err) {
    console.error('Error fetching commissions:', err);
    return json({ error: 'Failed to fetch commissions' }, { status: 500 });
  }
}

// PATCH commission status
export async function PATCH({ request, cookies }: RequestEvent) {
  if (!isAuthenticated(cookies)) {
    return json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const { id, status, accepted_at, completion_date, scheduled_at, paid_amount, payment_reference } = await request.json();

    // Get current commission to access email
    const currentComm = await db.select().from(commissions).where(eq(commissions.id, id));
    const commission = currentComm[0];

    if (!commission) {
      return json({ error: 'Commission not found' }, { status: 404 });
    }

    const updateData: any = { status };
    if (accepted_at) updateData.accepted_at = new Date(accepted_at);
    if (completion_date) updateData.completion_date = new Date(completion_date);
    if (scheduled_at) updateData.scheduled_at = new Date(scheduled_at);
    if (paid_amount !== undefined) updateData.paid_amount = paid_amount;
    if (payment_reference !== undefined) updateData.payment_reference = payment_reference;

    await db.update(commissions).set(updateData).where(eq(commissions.id, id));

    // Send emails based on status change
    if (status === 'approved' && commission.status === 'pending') {
      await sendAcceptanceEmail(commission.email, commission.client_name, completion_date || new Date().toISOString());
    } else if (status === 'rejected' && commission.status === 'pending') {
      await sendRejectionEmail(commission.email, commission.client_name);
    }

    return json({ success: true });
  } catch (err) {
    console.error('Error updating commission:', err);
    return json({ error: 'Failed to update commission' }, { status: 500 });
  }
}

// DELETE commission
export async function DELETE({ request, cookies }: RequestEvent) {
  if (!isAuthenticated(cookies)) {
    return json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const { id } = await request.json();

    await db.delete(commissions).where(eq(commissions.id, id));

    return json({ success: true });
  } catch (err) {
    console.error('Error deleting commission:', err);
    return json({ error: 'Failed to delete commission' }, { status: 500 });
  }
}
