import { json } from '@sveltejs/kit';
import type { RequestEvent } from './$types';

export async function GET({ cookies }: RequestEvent) {
  const sessionId = cookies.get('admin_session');

  // Simple check - if session cookie exists, user is authenticated
  if (sessionId) {
    return json({ authenticated: true });
  }

  return json({ error: 'Not authenticated' }, { status: 401 });
}
