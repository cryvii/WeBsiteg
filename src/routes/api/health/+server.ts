import { json } from '@sveltejs/kit';
import type { RequestEvent } from './$types';

export async function GET({}: RequestEvent) {
  return json({ ok: true, now: new Date().toISOString() });
}
