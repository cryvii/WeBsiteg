import { json } from '@sveltejs/kit';
import type { RequestEvent } from './$types';
import crypto from 'crypto';

// Hash password (simple example; use bcrypt in production)
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

const ADMIN_USERNAME = 'Test';
const ADMIN_PASSWORD_HASH = hashPassword('test123');

export async function POST({ request, cookies }: RequestEvent) {
  const body = await request.json();
  const { username, password } = body;

  if (username !== ADMIN_USERNAME || hashPassword(password) !== ADMIN_PASSWORD_HASH) {
    return json({ error: 'Invalid credentials' }, { status: 401 });
  }

  // Create session token
  const sessionId = crypto.randomUUID();
  
  // Set secure cookie (browser will handle session)
  cookies.set('admin_session', sessionId, {
    path: '/',
    httpOnly: true,
    maxAge: 24 * 60 * 60, // 24 hours
    sameSite: 'strict'
  });

  return json({ success: true });
}

