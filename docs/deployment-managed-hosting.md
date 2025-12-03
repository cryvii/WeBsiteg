# Managed Hosting Deployment Guide

This guide walks you through deploying the Seasonal Bunker application using Vercel (hosting) and Neon (database). Both services offer generous free tiers that are perfect for this application.

## Prerequisites

- Git repository with your code (GitHub, GitLab, or Bitbucket)
- Node.js 18+ installed locally (for running migrations)
- npm or pnpm installed locally

## Overview

**Deployment Architecture:**
```
User Browser → Vercel Edge Network → SvelteKit App (Serverless) → Neon PostgreSQL
```

**Estimated Setup Time:** 15-20 minutes

---

## Part 1: Set Up Neon Database

### Step 1: Create Neon Account

1. Go to [https://neon.tech](https://neon.tech)
2. Click "Sign Up" and create an account (GitHub sign-in recommended)
3. Verify your email if required

### Step 2: Create a New Project

1. After logging in, click "Create Project" or "New Project"
2. Configure your project:
   - **Project Name:** `seasonal-bunker` (or your preferred name)
   - **Region:** Choose the region closest to your users
   - **PostgreSQL Version:** 16 (latest stable)
3. Click "Create Project"

### Step 3: Get Database Connection String

1. Once the project is created, you'll see the connection details
2. Look for the **Connection String** section
3. Copy the connection string - it will look like:
   ```
   postgresql://username:password@ep-xxx-xxx.region.aws.neon.tech/dbname?sslmode=require
   ```
4. **Important:** Save this connection string securely - you'll need it for both Vercel and local migrations

### Step 4: Configure Database Settings (Optional)

Neon's free tier includes:
- 0.5 GB storage
- Auto-suspend after 5 minutes of inactivity
- Unlimited compute hours

For this application, the defaults are perfect. No additional configuration needed.

---

## Part 2: Run Database Migrations

Before deploying to Vercel, initialize your database schema.

> **📖 Detailed Guide:** For comprehensive migration documentation, see [Database Migration Guide](./database-migration-guide.md)

### Step 1: Set Up Local Environment

> **📖 Environment Variables Guide:** For complete documentation on environment variables and security best practices, see [Environment Variables Guide](./environment-variables.md)

1. Create a `.env` file in your project root (if it doesn't exist):
   ```bash
   cp .env.example .env
   ```

2. Add your Neon connection string to `.env`:
   ```env
   DATABASE_URL=postgresql://username:password@ep-xxx-xxx.region.aws.neon.tech/dbname?sslmode=require
   ```

3. **⚠️ Security Warning:** Never commit your `.env` file to version control!
   - The `.env` file is already in `.gitignore`
   - It contains sensitive database credentials
   - Always use `.env.example` as a template (safe to commit)

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Run Migrations

```bash
npx drizzle-kit push
```

This command will:
- Connect to your Neon database
- Create the required tables: `users`, `settings`, `commissions`
- Create the `status` enum
- Show you a summary of changes

**Expected Output:**
```
✓ Applying migrations...
✓ Created table "users"
✓ Created table "settings"  
✓ Created table "commissions"
✓ Created enum "status"
✓ Migrations complete!
```

### Step 4: Verify Schema

Run the automated verification script:

```bash
npm run verify-schema
```

This will check that all tables, columns, and constraints are correctly created.

**Expected Output:**
```
✓ Database connection successful
✓ Table 'users' exists with correct schema
✓ Table 'settings' exists with correct schema
✓ Table 'commissions' exists with correct schema
✓ Enum 'status' exists with correct values
✅ Schema verification complete! All checks passed.
```

Alternatively, verify manually in the Neon dashboard:

1. Go to your Neon dashboard
2. Click on your project
3. Navigate to "Tables" in the sidebar
4. You should see: `users`, `settings`, `commissions`

---

## Part 3: Deploy to Vercel

### Step 1: Create Vercel Account

1. Go to [https://vercel.com](https://vercel.com)
2. Click "Sign Up"
3. **Recommended:** Sign up with the same GitHub account that hosts your repository
4. Complete the onboarding flow

### Step 2: Import Your Project

1. From the Vercel dashboard, click "Add New..." → "Project"
2. Select "Import Git Repository"
3. Choose your repository from the list
   - If you don't see it, click "Adjust GitHub App Permissions" to grant access
4. Click "Import" on your repository

### Step 3: Configure Build Settings

Vercel should auto-detect SvelteKit. Verify these settings:

- **Framework Preset:** SvelteKit
- **Build Command:** `npm run build` (or `vite build`)
- **Output Directory:** `.vercel/output` (auto-configured by adapter)
- **Install Command:** `npm install`

**Note:** The project is already configured with `@sveltejs/adapter-vercel` in `svelte.config.js`, so no code changes are needed.

### Step 4: Add Environment Variables

Before deploying, add your database connection string:

1. In the project configuration screen, find "Environment Variables"
2. Add a new variable:
   - **Name:** `DATABASE_URL`
   - **Value:** Your Neon connection string (the one you saved earlier)
   - **Environment:** Select all (Production, Preview, Development)
3. Click "Add"

**🔒 Security Notes:** 
- Environment variables are encrypted at rest by Vercel
- They are never exposed to client-side code
- Only server-side code can access them
- See [Environment Variables Guide](./environment-variables.md) for more details

### Step 5: Deploy

1. Click "Deploy"
2. Vercel will:
   - Clone your repository
   - Install dependencies
   - Build your application
   - Deploy to their edge network
3. Wait 1-3 minutes for the build to complete

### Step 6: Verify Deployment

1. Once deployment completes, you'll see a success screen with your URL
2. Click "Visit" or copy the URL (e.g., `https://seasonal-bunker.vercel.app`)
3. Open the URL in your browser
4. Verify the application loads correctly

---

## Part 4: Set Up Automatic Deployments

Vercel automatically sets up continuous deployment:

- **Push to main branch** → Automatic production deployment
- **Push to other branches** → Preview deployments with unique URLs
- **Pull requests** → Preview deployments for testing

No additional configuration needed!

---

## Part 5: Post-Deployment Verification

### Automated Verification

Run the comprehensive deployment verification script:

```bash
npm run verify-deployment -- --url https://your-app.vercel.app
```

This will automatically test:
- ✓ Application accessibility
- ✓ Database connectivity
- ✓ Data persistence
- ✓ Build artifacts
- ✓ Environment variable configuration
- ✓ Security (no exposed secrets)
- ✓ Schema initialization

**Expected Output:**
```
✓ Application is accessible and returns HTML
✓ Successfully connected and queried database
✓ Data persisted correctly
✓ All tables and enums initialized correctly
✓ Build output found
✓ Environment variables configured correctly
✓ No security issues detected

✅ All verification checks passed!
```

### Manual Testing

If you prefer to test manually:

1. Visit your deployed application
2. Try creating a commission (if the form is accessible)
3. Verify data is saved by refreshing the page

### Check Build Logs

If something doesn't work:

1. Go to Vercel dashboard → Your project
2. Click on the latest deployment
3. Click "View Build Logs"
4. Look for errors in the build or runtime logs

### Verify Environment Variables

1. In Vercel dashboard, go to Settings → Environment Variables
2. Confirm `DATABASE_URL` is set
3. If you need to update it, change the value and redeploy

---

## Updating Your Deployment

### Code Changes

Simply push to your repository:

```bash
git add .
git commit -m "Update feature"
git push origin main
```

Vercel will automatically rebuild and deploy.

### Database Schema Changes

If you modify `src/lib/server/db/schema.ts`:

1. Update your local `.env` with the production `DATABASE_URL`
2. Run migrations:
   ```bash
   npx drizzle-kit push
   ```
3. Push your code changes to trigger a Vercel deployment

**Warning:** Be careful with schema changes on production data. Consider backing up first.

---

## Troubleshooting

### Build Fails with "Cannot find module"

**Problem:** Missing dependencies or incorrect imports.

**Solution:**
1. Check build logs for the specific missing module
2. Ensure all dependencies are in `package.json` (not just `devDependencies` if needed at runtime)
3. Run `npm install` locally to verify
4. Push changes and redeploy

### "Database connection failed" Error

**Problem:** Application can't connect to Neon database.

**Solutions:**

1. **Verify DATABASE_URL is set:**
   - Go to Vercel → Settings → Environment Variables
   - Confirm `DATABASE_URL` exists and is correct
   - If you updated it, redeploy the application

2. **Check connection string format:**
   - Must include `?sslmode=require` at the end
   - Should look like: `postgresql://user:pass@host/db?sslmode=require`

3. **Verify Neon database is active:**
   - Go to Neon dashboard
   - Check if database is suspended (it auto-wakes on connection)
   - Try connecting from your local machine first

4. **Check Neon connection limits:**
   - Free tier allows 100 concurrent connections
   - If you hit the limit, wait a few minutes for connections to close

### Application Loads but Shows Errors

**Problem:** Runtime errors in the application.

**Solutions:**

1. **Check Vercel Function Logs:**
   - Go to Vercel dashboard → Your project → Logs
   - Look for runtime errors
   - Common issues: missing env vars, database query errors

2. **Test locally with production DATABASE_URL:**
   ```bash
   DATABASE_URL="your-neon-url" npm run dev
   ```
   - This helps isolate if it's a deployment issue or code issue

3. **Verify migrations ran successfully:**
   - Check Neon dashboard → Tables
   - Ensure all tables exist: `users`, `settings`, `commissions`
   - If missing, run `npx drizzle-kit push` again

### Slow Cold Starts

**Problem:** First request after inactivity is slow.

**Explanation:** 
- Neon auto-suspends after 5 minutes of inactivity
- First request wakes the database (~1-2 seconds)
- Vercel serverless functions also have cold starts

**Solutions:**
- This is normal for free tiers
- Subsequent requests will be fast
- For production with high traffic, consider Neon's paid tier (no auto-suspend)

### Environment Variables Not Updating

**Problem:** Changed `DATABASE_URL` but application still uses old value.

**Solution:**
1. Update the environment variable in Vercel dashboard
2. **Important:** Trigger a new deployment
   - Either push a new commit
   - Or go to Deployments → Latest → "..." → "Redeploy"
3. Environment variables are only loaded at build/deploy time

### "Too Many Connections" Error

**Problem:** Exceeded Neon's connection limit.

**Solutions:**

1. **Check for connection leaks in code:**
   - Ensure database connections are properly closed
   - Review `src/lib/server/db/index.ts`

2. **Wait for connections to close:**
   - Neon automatically closes idle connections after 5 minutes
   - Wait and try again

3. **Reduce connection pool size:**
   - Modify the postgres client configuration if needed

### Build Succeeds but Site Shows 404

**Problem:** Vercel deployed but routes don't work.

**Solutions:**

1. **Verify adapter configuration:**
   - Check `svelte.config.js` uses `@sveltejs/adapter-vercel`
   - Should already be configured correctly

2. **Check Vercel build output:**
   - Look for `.vercel/output` directory in build logs
   - Ensure it contains the compiled application

3. **Verify SvelteKit routes:**
   - Check `src/routes` directory structure
   - Ensure `+page.svelte` files exist

### Database Schema Out of Sync

**Problem:** Application errors suggest missing columns or tables.

**Solution:**

1. **Check current schema:**
   - Go to Neon dashboard → Tables
   - Compare with `src/lib/server/db/schema.ts`

2. **Run migrations:**
   ```bash
   DATABASE_URL="your-neon-url" npx drizzle-kit push
   ```

3. **If schema is corrupted, reset (⚠️ destroys data):**
   ```bash
   # Drop all tables in Neon dashboard
   # Then run migrations again
   npx drizzle-kit push
   ```

---

## Cost and Limits

### Neon Free Tier

- **Storage:** 0.5 GB
- **Compute:** Unlimited hours (with auto-suspend)
- **Connections:** Up to 100 concurrent
- **Branches:** 10 database branches
- **Auto-suspend:** After 5 minutes of inactivity

**Sufficient for:** Personal projects, small applications, development

### Vercel Free Tier

- **Bandwidth:** 100 GB/month
- **Serverless Function Execution:** 100 GB-hours/month
- **Build Execution:** 100 hours/month
- **Deployments:** Unlimited

**Sufficient for:** Most small to medium applications

### When to Upgrade

Consider upgrading if you experience:
- Frequent "storage full" errors (Neon)
- Bandwidth limit warnings (Vercel)
- Need for faster cold starts (Neon paid tier removes auto-suspend)
- Need for custom domains (Vercel Pro)

---

## Next Steps

✅ Your application is now deployed and accessible worldwide!

**Recommended actions:**

1. **Set up a custom domain** (optional):
   - Go to Vercel → Settings → Domains
   - Add your domain and follow DNS configuration steps

2. **Monitor your application:**
   - Check Vercel Analytics (free)
   - Review Neon database metrics

3. **Set up admin user:**
   - Create an admin account in the `users` table
   - Use a password hashing tool or create via application

4. **Configure commission settings:**
   - Insert a row in the `settings` table
   - Or create an admin interface to manage settings

5. **Test the full workflow:**
   - Submit a test commission
   - Verify it appears in the database
   - Test admin functionality

---

## Additional Resources

- **Vercel Documentation:** https://vercel.com/docs
- **Neon Documentation:** https://neon.tech/docs
- **SvelteKit Deployment:** https://kit.svelte.dev/docs/adapter-vercel
- **Drizzle ORM Migrations:** https://orm.drizzle.team/kit-docs/overview

---

## Getting Help

If you encounter issues not covered in this guide:

1. Check Vercel build logs for specific error messages
2. Review Neon connection logs in the dashboard
3. Test locally with production `DATABASE_URL` to isolate issues
4. Consult the troubleshooting section above
5. Check the official documentation for Vercel and Neon

**Common support resources:**
- Vercel Discord: https://vercel.com/discord
- Neon Discord: https://neon.tech/discord
- SvelteKit Discord: https://svelte.dev/chat
