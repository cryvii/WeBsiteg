# Database Migration Guide

This guide explains how to run database migrations for the Seasonal Bunker application using Drizzle ORM. Migrations create and update the database schema to match your application code.

## Overview

The application uses:
- **Drizzle ORM**: Type-safe database toolkit
- **Drizzle Kit**: Migration management tool
- **PostgreSQL**: Database (via Neon or local installation)

## Prerequisites

- Node.js 18+ installed
- Database connection string (from Neon or local PostgreSQL)
- Project dependencies installed (`npm install`)

> **📖 Environment Variables Guide:** For complete documentation on configuring `DATABASE_URL` securely, see [Environment Variables Guide](./environment-variables.md)

---

## Understanding the Schema

The application uses three main tables:

### 1. Users Table
Stores admin user credentials for authentication.

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL
);
```

### 2. Settings Table
Stores global commission settings (singleton pattern).

```sql
CREATE TABLE settings (
  id BOOLEAN PRIMARY KEY DEFAULT true,
  is_commissions_open BOOLEAN DEFAULT true NOT NULL,
  queue_limit INTEGER DEFAULT 200 NOT NULL
);
```

**Note:** The `id` field uses a boolean trick to enforce only one row (always `true`).

### 3. Commissions Table
Stores commission requests from clients.

```sql
CREATE TABLE commissions (
  id SERIAL PRIMARY KEY,
  client_name TEXT NOT NULL,
  email TEXT NOT NULL,
  description TEXT NOT NULL,
  price INTEGER,
  status status DEFAULT 'pending' NOT NULL,
  rejection_reason TEXT,
  created_at TIMESTAMP DEFAULT now() NOT NULL
);
```

### 4. Status Enum
Defines valid commission statuses.

```sql
CREATE TYPE status AS ENUM(
  'pending',
  'approved', 
  'rejected',
  'paid',
  'completed'
);
```

---

## Running Migrations on Neon

### Step 1: Get Your Database Connection String

1. Log in to [Neon Dashboard](https://console.neon.tech)
2. Select your project
3. Copy the connection string from the dashboard
4. It should look like:
   ```
   postgresql://username:password@ep-xxx-xxx.region.aws.neon.tech/dbname?sslmode=require
   ```

### Step 2: Set Environment Variable

**Option A: Using .env file (recommended for local development)**

1. Create or edit `.env` in your project root:
   ```bash
   touch .env
   ```

2. Add your connection string:
   ```env
   DATABASE_URL=postgresql://username:password@ep-xxx-xxx.region.aws.neon.tech/dbname?sslmode=require
   ```

3. Ensure `.env` is in `.gitignore` (it should already be)

**Option B: Using command line (one-time operations)**

```bash
DATABASE_URL="your-connection-string" npx drizzle-kit push
```

### Step 3: Run Migrations

```bash
npx drizzle-kit push
```

**What this does:**
- Connects to your Neon database
- Compares your schema (`src/lib/server/db/schema.ts`) with the database
- Creates or updates tables to match your schema
- Shows you a summary of changes before applying

**Expected Output:**
```
✓ Pulling schema from database...
✓ Comparing schemas...
✓ Changes detected:
  + Create table "users"
  + Create table "settings"
  + Create table "commissions"
  + Create enum "status"
✓ Applying changes...
✓ Done!
```

### Step 4: Verify Migration

Run the verification script (see below) or manually check:

```bash
npm run verify-schema
```

Or check in Neon Dashboard:
1. Go to your project
2. Click "Tables" in the sidebar
3. Verify you see: `users`, `settings`, `commissions`
4. Click on each table to inspect columns

---

## Running Migrations Locally

If you're using a local PostgreSQL database:

### Step 1: Ensure PostgreSQL is Running

**macOS (Homebrew):**
```bash
brew services start postgresql@16
```

**Linux:**
```bash
sudo systemctl start postgresql
```

**Windows:**
- Start PostgreSQL from Services or pgAdmin

### Step 2: Create Database

```bash
# Connect to PostgreSQL
psql postgres

# Create database
CREATE DATABASE seasonal_bunker;

# Exit
\q
```

### Step 3: Set Connection String

In your `.env` file:
```env
DATABASE_URL=postgresql://username:password@localhost:5432/seasonal_bunker
```

Replace `username` and `password` with your PostgreSQL credentials.

### Step 4: Run Migrations

```bash
npx drizzle-kit push
```

---

## Verifying Schema After Migration

### Automated Verification

Use the provided verification script:

```bash
npm run verify-schema
```

This script checks:
- ✓ Database connection is successful
- ✓ All required tables exist
- ✓ Status enum is created
- ✓ Table columns match expected schema
- ✓ Constraints are properly set

**Expected Output:**
```
🔍 Verifying database schema...

✓ Database connection successful
✓ Table 'users' exists with correct schema
✓ Table 'settings' exists with correct schema
✓ Table 'commissions' exists with correct schema
✓ Enum 'status' exists with correct values

✅ Schema verification complete! All checks passed.
```

### Manual Verification

**Using Neon Dashboard:**
1. Go to [Neon Console](https://console.neon.tech)
2. Select your project
3. Click "Tables" to see all tables
4. Click on each table to inspect columns and types

**Using psql:**
```bash
# Connect to database
psql "your-connection-string"

# List all tables
\dt

# Describe users table
\d users

# Describe settings table
\d settings

# Describe commissions table
\d commissions

# List enums
\dT

# Exit
\q
```

**Using Drizzle Studio (GUI):**
```bash
npx drizzle-kit studio
```

This opens a web interface at `https://local.drizzle.studio` where you can:
- Browse tables and data
- Run queries
- Inspect schema

---

## Seeding Initial Data

### Creating an Admin User

After migrations, you'll need at least one admin user to access the admin panel.

**Option 1: Using a seed script (recommended)**

Create `scripts/seed-admin.ts`:

```typescript
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { users } from '../src/lib/server/db/schema';
import * as crypto from 'crypto';

const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString);
const db = drizzle(client);

async function seedAdmin() {
  // Simple hash for demo - use bcrypt in production!
  const password = 'admin123';
  const hash = crypto.createHash('sha256').update(password).digest('hex');
  
  await db.insert(users).values({
    username: 'admin',
    password_hash: hash
  });
  
  console.log('✓ Admin user created');
  console.log('  Username: admin');
  console.log('  Password: admin123');
  console.log('  ⚠️  Change this password immediately!');
  
  await client.end();
}

seedAdmin().catch(console.error);
```

Run it:
```bash
npx tsx scripts/seed-admin.ts
```

**Option 2: Using SQL directly**

```sql
-- Connect to your database
psql "your-connection-string"

-- Insert admin user (password: admin123, hashed with SHA256)
INSERT INTO users (username, password_hash) 
VALUES ('admin', 'YOUR_HASHED_PASSWORD_HERE');
```

**Option 3: Using Drizzle Studio**

```bash
npx drizzle-kit studio
```

Then manually insert a row in the `users` table.

### Initializing Settings

The settings table should have exactly one row:

```sql
INSERT INTO settings (id, is_commissions_open, queue_limit)
VALUES (true, true, 200);
```

Or using a seed script:

```typescript
import { settings } from '../src/lib/server/db/schema';

await db.insert(settings).values({
  id: true,
  is_commissions_open: true,
  queue_limit: 200
});
```

### Seeding Test Commissions (Optional)

For development/testing:

```sql
INSERT INTO commissions (client_name, email, description, status)
VALUES 
  ('John Doe', 'john@example.com', 'Character illustration', 'pending'),
  ('Jane Smith', 'jane@example.com', 'Logo design', 'approved'),
  ('Bob Wilson', 'bob@example.com', 'Website banner', 'completed');
```

---

## Common Migration Scenarios

### Scenario 1: Fresh Database Setup

**When:** First time deploying or setting up a new environment.

**Steps:**
1. Get database connection string
2. Set `DATABASE_URL` environment variable
3. Run `npx drizzle-kit push`
4. Verify with `npm run verify-schema`
5. Seed initial data (admin user, settings)

### Scenario 2: Schema Changes

**When:** You modified `src/lib/server/db/schema.ts`.

**Steps:**
1. Make changes to schema file
2. Run `npx drizzle-kit push`
3. Review the changes Drizzle Kit shows you
4. Confirm to apply changes
5. Test your application

**Example:** Adding a new column to commissions:

```typescript
// In schema.ts
export const commissions = pgTable('commissions', {
  // ... existing columns ...
  notes: text('notes'), // New column
});
```

Then run:
```bash
npx drizzle-kit push
```

### Scenario 3: Production Database Migration

**When:** Updating schema on a live database with real data.

**⚠️ Important:** Always backup first!

**Steps:**
1. **Backup your database:**
   - Neon: Use dashboard to create a backup or branch
   - Local: `pg_dump dbname > backup.sql`

2. **Test migration locally:**
   - Create a copy of production data locally
   - Run migration on the copy
   - Verify everything works

3. **Run migration on production:**
   ```bash
   DATABASE_URL="production-url" npx drizzle-kit push
   ```

4. **Verify:**
   ```bash
   DATABASE_URL="production-url" npm run verify-schema
   ```

5. **Test application:**
   - Check that existing data is intact
   - Test new functionality

### Scenario 4: Rolling Back Migrations

Drizzle Kit's `push` command doesn't have built-in rollback. If you need to undo changes:

**Option 1: Restore from backup**
```bash
psql "your-connection-string" < backup.sql
```

**Option 2: Manual SQL to undo changes**
```sql
-- Example: Remove a column
ALTER TABLE commissions DROP COLUMN notes;

-- Example: Drop a table
DROP TABLE new_table;
```

**Option 3: Use Neon branches (Neon only)**
- Create a branch before migrating
- If migration fails, switch back to the original branch

---

## Troubleshooting

### Error: "Cannot connect to database"

**Possible causes:**
- Incorrect `DATABASE_URL`
- Database is suspended (Neon auto-suspends after 5 min)
- Network/firewall issues
- Missing `?sslmode=require` for Neon

**Solutions:**
1. Verify connection string is correct
2. Try connecting with `psql` to test:
   ```bash
   psql "your-connection-string"
   ```
3. For Neon, ensure `?sslmode=require` is at the end
4. Check Neon dashboard to see if database is active

### Error: "relation already exists"

**Cause:** Table already exists in database.

**Solution:**
- This is usually fine - Drizzle Kit will skip existing tables
- If you want to recreate tables, drop them first:
  ```sql
  DROP TABLE IF EXISTS commissions CASCADE;
  DROP TABLE IF EXISTS settings CASCADE;
  DROP TABLE IF EXISTS users CASCADE;
  DROP TYPE IF EXISTS status CASCADE;
  ```
- Then run migrations again

### Error: "column does not exist"

**Cause:** Application code expects a column that doesn't exist in database.

**Solution:**
1. Check if you forgot to run migrations after schema changes
2. Run `npx drizzle-kit push` to sync schema
3. Verify with `npm run verify-schema`

### Error: "permission denied"

**Cause:** Database user doesn't have required permissions.

**Solution:**
- For Neon: Use the default connection string (has full permissions)
- For local PostgreSQL: Grant permissions:
  ```sql
  GRANT ALL PRIVILEGES ON DATABASE seasonal_bunker TO your_user;
  ```

### Migrations Hang or Timeout

**Cause:** Database is unreachable or very slow.

**Solutions:**
1. Check internet connection
2. For Neon: Database might be waking from suspend (wait 30 seconds)
3. Increase timeout in `drizzle.config.ts`:
   ```typescript
   export default defineConfig({
     // ... other config ...
     dbCredentials: {
       url: process.env.DATABASE_URL!,
       connectionTimeoutMillis: 30000, // 30 seconds
     },
   });
   ```

### Schema Drift

**Problem:** Database schema doesn't match code schema.

**Detection:**
```bash
npm run verify-schema
```

**Solution:**
```bash
npx drizzle-kit push
```

This will show you the differences and let you apply changes.

---

## Best Practices

### 1. Always Use Environment Variables

Never hardcode database credentials:

❌ **Bad:**
```typescript
const client = postgres('postgresql://user:pass@host/db');
```

✅ **Good:**
```typescript
const client = postgres(process.env.DATABASE_URL!);
```

### 2. Backup Before Production Migrations

Always create a backup before running migrations on production:

```bash
# Neon: Create a branch in dashboard
# Local: 
pg_dump seasonal_bunker > backup_$(date +%Y%m%d).sql
```

### 3. Test Migrations Locally First

Never run untested migrations on production:

1. Test on local database
2. Test on staging/preview environment
3. Then apply to production

### 4. Use Drizzle Studio for Inspection

```bash
npx drizzle-kit studio
```

Great for:
- Inspecting schema
- Viewing data
- Testing queries
- Debugging issues

### 5. Keep Schema and Code in Sync

After changing schema:
1. Run migrations immediately
2. Test the application
3. Commit both schema changes and migration files

### 6. Document Schema Changes

When modifying schema, document:
- What changed
- Why it changed
- Any data migration needed
- Impact on existing data

### 7. Use Transactions for Data Migrations

When migrating data (not just schema):

```typescript
await db.transaction(async (tx) => {
  // Multiple operations here
  // All succeed or all fail
});
```

---

## Migration Checklist

Use this checklist when running migrations:

- [ ] Backup database (if production)
- [ ] Set `DATABASE_URL` environment variable
- [ ] Run `npx drizzle-kit push`
- [ ] Review changes before confirming
- [ ] Run `npm run verify-schema`
- [ ] Test application functionality
- [ ] Seed initial data if needed
- [ ] Update documentation if schema changed
- [ ] Commit migration files to git

---

## Verification Scripts

The project includes two verification scripts to help ensure your deployment is configured correctly:

### Schema Verification

Verifies that the database schema matches the expected structure:

```bash
npm run verify-schema
```

**What it checks:**
- Database connectivity
- All required tables exist (users, settings, commissions)
- All columns have correct types and constraints
- Status enum exists with correct values
- Data summary (row counts)

**When to use:**
- After running migrations
- When troubleshooting database issues
- Before deploying to production
- After schema changes

### Deployment Verification

Comprehensive verification of a managed hosting deployment:

```bash
# Local verification (without URL)
npm run verify-deployment

# Full verification with deployment URL
npm run verify-deployment -- --url https://your-app.vercel.app
```

**What it checks:**
- Application accessibility (if URL provided)
- Database connectivity
- Data persistence (insert/query round-trip)
- Build success
- Build artifacts present
- Environment variable access
- Environment variable security
- Schema initialization

**When to use:**
- After deploying to Vercel
- When troubleshooting deployment issues
- Before going live with production
- As part of CI/CD pipeline

---

## Additional Resources

- **Drizzle ORM Docs:** https://orm.drizzle.team
- **Drizzle Kit Docs:** https://orm.drizzle.team/kit-docs/overview
- **Neon Docs:** https://neon.tech/docs
- **PostgreSQL Docs:** https://www.postgresql.org/docs/

---

## Getting Help

If you encounter issues:

1. Check the troubleshooting section above
2. Review Drizzle Kit documentation
3. Check database logs (Neon dashboard or PostgreSQL logs)
4. Verify connection string is correct
5. Test connection with `psql` directly

**Support Resources:**
- Drizzle Discord: https://discord.gg/drizzle
- Neon Discord: https://neon.tech/discord
