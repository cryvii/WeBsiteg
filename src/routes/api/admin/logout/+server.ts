import { json } from '@sveltejs/kit';
import type { RequestEvent } from './$types';

export async function POST({ cookies }: RequestEvent) {
  cookies.delete('admin_session', { path: '/' });
  return json({ success: true });
}
