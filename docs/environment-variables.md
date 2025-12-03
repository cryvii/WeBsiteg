# Environment Variables Guide

## Overview

This document describes all environment variables used by the Seasonal Bunker application and how to configure them securely.

## ⚠️ Security Warning

**NEVER commit your `.env` file to version control!**

- The `.env` file contains sensitive credentials like database passwords
- Always use `.env.example` as a template (safe to commit)
- The `.gitignore` file is configured to exclude `.env` files
- Double-check before committing that no secrets are included

## Required Environment Variables

### `DATABASE_URL`

**Description:** PostgreSQL database connection string

**Required:** Yes

**Format:**
```
postgresql://[username]:[password]@[host]:[port]/[database]?[options]
```

**Examples:**

**Local PostgreSQL:**
```env
DATABASE_URL=postgresql://user:password@localhost:5432/bunker
```

**Neon (Managed Database):**
```env
DATABASE_URL=postgresql://username:password@ep-xxx-xxx.region.aws.neon.tech/dbname?sslmode=require
```

**Docker Compose:**
```env
DATABASE_URL=postgresql://user:password@db:5432/bunker
```

**Notes:**
- For Neon and other managed services, always include `?sslmode=require`
- The connection string includes sensitive credentials - keep it secret!
- Used by Drizzle ORM to connect to the database

---

## Optional Environment Variables

### `ORIGIN`

**Description:** The origin URL of your application (used by SvelteKit for CSRF protection)

**Required:** No (SvelteKit can auto-detect in most cases)

**Format:**
```
http://[host]:[port]  or  https://[domain]
```

**Examples:**

**Local Development:**
```env
ORIGIN=http://localhost:5173
```

**Production:**
```env
ORIGIN=https://seasonal-bunker.vercel.app
```

**Notes:**
- Only needed if you encounter CSRF errors
- Must match the URL users access your site from
- Include protocol (http:// or https://)
- No trailing slash

---

## Setup Instructions

### For Local Development

1. **Copy the template:**
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` with your values:**
   ```bash
   nano .env
   # or use your preferred editor
   ```

3. **Set your database URL:**
   - For local PostgreSQL: `postgresql://user:password@localhost:5432/bunker`
   - For Neon: Copy from Neon dashboard

4. **Verify `.env` is ignored:**
   ```bash
   git status
   # .env should NOT appear in the list
   ```

### For Managed Hosting (Vercel)

1. **Go to Vercel Dashboard:**
   - Navigate to your project
   - Go to Settings → Environment Variables

2. **Add `DATABASE_URL`:**
   - Name: `DATABASE_URL`
   - Value: Your Neon connection string
   - Environments: Select all (Production, Preview, Development)

3. **Add `ORIGIN` (if needed):**
   - Name: `ORIGIN`
   - Value: Your production URL (e.g., `https://your-app.vercel.app`)
   - Environments: Production only

4. **Redeploy:**
   - Environment variables only take effect after redeployment
   - Push a new commit or manually trigger a redeploy

### For Self-Hosting

1. **Create `.env` file:**
   ```bash
   cp .env.example .env
   ```

2. **Configure for your setup:**
   - Local PostgreSQL: Use `localhost` in DATABASE_URL
   - Neon database: Use Neon connection string
   - Set ORIGIN to your Cloudflare Tunnel URL (if using)

3. **Ensure `.env` is loaded:**
   - SvelteKit automatically loads `.env` in development
   - For production builds, ensure your startup script loads `.env`

---

## Verifying Environment Variables

### Check if Variables are Loaded

Create a test endpoint (remove after testing):

```typescript
// src/routes/api/test-env/+server.ts
import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

export async function GET() {
    return json({
        hasDatabaseUrl: !!env.DATABASE_URL,
        hasOrigin: !!env.ORIGIN,
        // Never return actual values!
    });
}
```

### Verify Database Connection

Run the schema verification script:

```bash
npm run verify-schema
```

This will attempt to connect using your `DATABASE_URL` and verify the schema.

---

## Troubleshooting

### "DATABASE_URL is not defined"

**Problem:** Application can't find the database connection string.

**Solutions:**

1. **Check `.env` file exists:**
   ```bash
   ls -la .env
   ```

2. **Verify `.env` format:**
   - No spaces around `=`
   - No quotes needed (usually)
   - Correct format: `DATABASE_URL=postgresql://...`

3. **For Vercel deployments:**
   - Check Settings → Environment Variables
   - Ensure variable is set for the correct environment
   - Redeploy after adding variables

4. **Restart development server:**
   ```bash
   # Stop the dev server (Ctrl+C)
   npm run dev
   ```

### "Connection refused" or "Connection timeout"

**Problem:** Can't connect to database.

**Solutions:**

1. **Verify database is running:**
   - Local: `pg_isready` or check Docker container
   - Neon: Check dashboard (auto-wakes on connection)

2. **Check connection string format:**
   - Correct protocol: `postgresql://` (not `postgres://`)
   - Correct host and port
   - For Neon: Include `?sslmode=require`

3. **Test connection manually:**
   ```bash
   psql "postgresql://user:password@host:port/dbname"
   ```

### "SSL connection required"

**Problem:** Database requires SSL but connection string doesn't specify it.

**Solution:**

Add `?sslmode=require` to your connection string:
```env
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
```

### Environment Variables Exposed to Client

**Problem:** Worried about security.

**Explanation:**

- Variables in `.env` are **server-side only**
- SvelteKit's `$env/dynamic/private` ensures they're never sent to the browser
- Only variables prefixed with `PUBLIC_` are exposed to clients
- `DATABASE_URL` is safe - it's never included in client bundles

**Verify:**
1. Build your application: `npm run build`
2. Search the build output: `grep -r "DATABASE_URL" build/`
3. Should find no matches (or only in server code)

---

## Best Practices

### ✅ Do

- Use `.env.example` as a template (commit this)
- Keep `.env` in `.gitignore` (already configured)
- Use different credentials for development and production
- Rotate credentials if they're accidentally exposed
- Use strong, unique passwords for database users
- Document all required variables in `.env.example`

### ❌ Don't

- Commit `.env` files to version control
- Share `.env` files via email or chat
- Use production credentials in development
- Hardcode credentials in source code
- Log environment variable values
- Expose `DATABASE_URL` to client-side code

---

## Adding New Environment Variables

When adding new environment variables to the application:

1. **Update `.env.example`:**
   ```env
   # Add your new variable with a description
   NEW_VARIABLE=example_value
   ```

2. **Document it in this file:**
   - Add a section describing the variable
   - Include format, examples, and notes

3. **Update deployment documentation:**
   - Add instructions for Vercel setup
   - Add instructions for self-hosting setup

4. **Notify team members:**
   - They'll need to update their local `.env` files
   - Update deployment environments

---

## Reference

### All Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | None | PostgreSQL connection string |
| `ORIGIN` | No | Auto-detected | Application origin URL for CSRF protection |

### Connection String Components

```
postgresql://username:password@host:port/database?options
           │         │         │    │    │        │
           │         │         │    │    │        └─ Query parameters (e.g., sslmode=require)
           │         │         │    │    └────────── Database name
           │         │         │    └─────────────── Port (default: 5432)
           │         │         └──────────────────── Hostname or IP
           │         └────────────────────────────── Password
           └──────────────────────────────────────── Username
```

---

## Additional Resources

- [SvelteKit Environment Variables](https://kit.svelte.dev/docs/modules#$env-dynamic-private)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [PostgreSQL Connection Strings](https://www.postgresql.org/docs/current/libpq-connect.html#LIBPQ-CONNSTRING)
- [Neon Connection Guide](https://neon.tech/docs/connect/connect-from-any-app)

