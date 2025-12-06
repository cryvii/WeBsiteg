import { json } from '@sveltejs/kit';
import type { RequestEvent } from './$types';
import crypto from 'crypto';

// Hash password (simple example; use bcrypt in production)
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// FORCE RESET: Ignoring environment variables to restore access
const ADMIN_USERNAME = 'Test';
const ADMIN_PASSWORD_HASH = hashPassword('test123');

export async function POST({ request, cookies }: RequestEvent) {
  const body = await request.json();
  const rawUsername = body.username ?? '';
  const rawPassword = body.password ?? '';

  const username = String(rawUsername).trim();
  const password = String(rawPassword).trim();

  const usernameMatches = username.toLowerCase() === ADMIN_USERNAME.toLowerCase();
  const passwordMatches = hashPassword(password) === ADMIN_PASSWORD_HASH;

  if (!usernameMatches || !passwordMatches) {
    console.warn(`Admin login failed for user: ${username}`);
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

