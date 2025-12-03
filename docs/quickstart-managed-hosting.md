# Quick Start: Managed Hosting (Vercel + Neon)

Get your Seasonal Bunker application deployed in 15 minutes with zero monthly costs.

## Prerequisites

- GitHub account (or GitLab/Bitbucket)
- Node.js 18+ installed locally
- Your code in a Git repository

---

## Step 1: Set Up Database (5 minutes)

1. **Create Neon account:** Go to [neon.tech](https://neon.tech) and sign up
2. **Create project:** Click "New Project" → Name it "seasonal-bunker" → Choose nearest region
3. **Copy connection string:** Save the PostgreSQL URL shown (starts with `postgresql://...`)

---

## Step 2: Initialize Database (3 minutes)

```bash
# Create .env file
cp .env.example .env

# Add your Neon connection string to .env
echo "DATABASE_URL=postgresql://your-connection-string" >> .env

# Install dependencies and run migrations
npm install
npx drizzle-kit push

# Verify schema
npm run verify-schema
```

**Expected output:** ✅ All tables created (users, settings, commissions)

---

## Step 3: Deploy to Vercel (5 minutes)

1. **Create Vercel account:** Go to [vercel.com](https://vercel.com) and sign up with GitHub
2. **Import project:** Click "Add New..." → "Project" → Select your repository
3. **Add environment variable:**
   - Name: `DATABASE_URL`
   - Value: Your Neon connection string
   - Environment: All (Production, Preview, Development)
4. **Deploy:** Click "Deploy" and wait 1-3 minutes

---

## Step 4: Verify Deployment (2 minutes)

```bash
# Run automated verification
npm run verify-deployment -- --url https://your-app.vercel.app
```

**Expected output:** ✅ All checks passed

Or manually visit your Vercel URL and test the application.

---

## ✅ Done!

Your application is now live at `https://your-app.vercel.app`

### What happens next?

- **Automatic deployments:** Push to main branch → Auto-deploy
- **Preview deployments:** Pull requests get unique preview URLs
- **Zero maintenance:** Vercel and Neon handle everything

### Common Commands

```bash
# Update deployment (just push to git)
git add .
git commit -m "Update feature"
git push origin main

# Run migrations after schema changes
npx drizzle-kit push

# Check deployment status
npm run verify-deployment -- --url https://your-app.vercel.app
```

---

## Troubleshooting

### Build fails
- Check Vercel build logs for specific errors
- Ensure all dependencies are in `package.json`
- Test locally: `npm run build`

### Database connection fails
- Verify `DATABASE_URL` is set in Vercel dashboard (Settings → Environment Variables)
- Ensure connection string ends with `?sslmode=require`
- Check Neon dashboard to confirm database is active

### Application loads but shows errors
- Check Vercel function logs (Dashboard → Logs)
- Test locally with production DATABASE_URL: `DATABASE_URL="your-neon-url" npm run dev`
- Verify migrations ran: Check Neon dashboard → Tables

### Slow first request
- Normal! Neon auto-suspends after 5 minutes of inactivity
- First request wakes database (~1-2 seconds)
- Subsequent requests are fast

---

## Free Tier Limits

**Neon:**
- 0.5 GB storage
- Unlimited compute hours (with auto-suspend)
- 100 concurrent connections

**Vercel:**
- 100 GB bandwidth/month
- 100 GB-hours serverless execution/month
- Unlimited deployments

**Sufficient for:** Personal projects, small applications, portfolios

---

## Next Steps

- **Custom domain:** Vercel Settings → Domains
- **Monitor usage:** Check Vercel Analytics and Neon metrics
- **Set up admin:** Create user in `users` table
- **Configure settings:** Add row to `settings` table

---

## Need More Details?

- **Full deployment guide:** [deployment-managed-hosting.md](./deployment-managed-hosting.md)
- **Database migrations:** [database-migration-guide.md](./database-migration-guide.md)
- **Environment variables:** [environment-variables.md](./environment-variables.md)
- **Compare approaches:** [deployment-comparison.md](./deployment-comparison.md)

---

**Questions?** Check the [full deployment guide](./deployment-managed-hosting.md) for detailed troubleshooting and advanced configuration.
