# Quick Start: Self-Hosting (Laptop + Cloudflare Tunnel)

Host your Seasonal Bunker application from your laptop with public internet access in 20 minutes.

## Prerequisites

- macOS, Linux, or Windows laptop
- Node.js 18+ installed
- Your application code locally

---

## Step 1: Choose Database Option (5-10 minutes)

### Option A: Use Neon (Recommended for beginners)

```bash
# 1. Create Neon account at neon.tech
# 2. Create project and copy connection string
# 3. Add to .env file
echo "DATABASE_URL=postgresql://your-neon-connection-string" > .env
```

**Pros:** No local setup, managed backups, accessible from anywhere

### Option B: Local PostgreSQL

**macOS:**
```bash
brew install postgresql@16
brew services start postgresql@16
createdb seasonal_bunker
echo "DATABASE_URL=postgresql://localhost:5432/seasonal_bunker" > .env
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo -u postgres createdb seasonal_bunker
echo "DATABASE_URL=postgresql://localhost:5432/seasonal_bunker" > .env
```

**Windows:**
- Download from [postgresql.org](https://www.postgresql.org/download/windows/)
- Install and create database "seasonal_bunker"
- Add connection string to `.env`

**Pros:** Full control, no external dependencies, works offline

---

## Step 2: Initialize Database (3 minutes)

```bash
# Install dependencies
npm install

# Run migrations
npx drizzle-kit push

# Verify schema
npm run verify-schema
```

**Expected output:** ✅ All tables created (users, settings, commissions)

---

## Step 3: Test Application Locally (2 minutes)

```bash
# Build and start the application
./scripts/start-app.sh
```

Visit `http://localhost:3000` to verify it works.

Press `Ctrl+C` to stop.

---

## Step 4: Set Up Cloudflare Tunnel (5-10 minutes)

### Option A: Quick Tunnel (Temporary, No Setup)

Perfect for testing or temporary access:

```bash
# Install cloudflared
brew install cloudflared  # macOS
# For Linux/Windows: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/

# Start app with quick tunnel
./scripts/start-with-quick-tunnel.sh
```

You'll get a random public URL like `https://random-name.trycloudflare.com`

**Pros:** No setup, instant access  
**Cons:** Random URL changes each time

### Option B: Named Tunnel (Permanent, Custom Domain)

For permanent hosting with custom domain:

```bash
# Install cloudflared (if not already)
brew install cloudflared  # macOS

# Authenticate with Cloudflare
cloudflared tunnel login

# Create named tunnel
cloudflared tunnel create seasonal-bunker

# Start app with named tunnel
./scripts/start-with-tunnel.sh seasonal-bunker
```

**Optional - Add custom domain:**

1. Create `~/.cloudflared/config.yml`:
```yaml
tunnel: <tunnel-id-from-creation>
credentials-file: ~/.cloudflared/<tunnel-id>.json

ingress:
  - hostname: app.yourdomain.com
    service: http://localhost:3000
  - service: http_status:404
```

2. Add DNS record in Cloudflare dashboard:
   - Type: CNAME
   - Name: app
   - Target: `<tunnel-id>.cfargotunnel.com`

**Pros:** Custom domain, permanent URL, reliable  
**Cons:** Requires Cloudflare account and domain

---

## Step 5: Verify Self-Hosting (2 minutes)

```bash
# With application running, verify in another terminal
npm run verify-self-hosting

# Or with tunnel URL
npm run verify-self-hosting -- --url https://your-tunnel-url.com
```

**Expected output:** ✅ All checks passed

---

## ✅ Done!

Your application is now publicly accessible!

### What's running?

- **Application:** Node.js server on `localhost:3000`
- **Tunnel:** Cloudflare tunnel forwarding traffic to your laptop
- **Database:** PostgreSQL (local or Neon)

### Keeping it running

The application runs as long as:
- Your laptop is on and connected to internet
- The terminal window stays open (or use process manager)

---

## Common Commands

```bash
# Start application only
./scripts/start-app.sh

# Start with quick tunnel (temporary URL)
./scripts/start-with-quick-tunnel.sh

# Start with named tunnel (permanent URL)
./scripts/start-with-tunnel.sh seasonal-bunker

# Verify deployment
npm run verify-self-hosting

# Run migrations after schema changes
npx drizzle-kit push

# Check database schema
npm run verify-schema
```

---

## Running on System Startup (Optional)

### Using PM2 (Cross-Platform)

```bash
# Install PM2
npm install -g pm2

# Start application with PM2
pm2 start build/index.js --name seasonal-bunker

# Save configuration
pm2 save

# Enable startup on boot
pm2 startup
# Follow the instructions shown

# Manage process
pm2 status          # Check status
pm2 logs            # View logs
pm2 restart all     # Restart
pm2 stop all        # Stop
```

### macOS (launchd) or Linux (systemd)

See [scripts/README.md](../scripts/README.md) for detailed instructions.

---

## Troubleshooting

### Application won't start

```bash
# Check if port 3000 is already in use
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows

# Kill the process using the port
kill -9 <PID>  # macOS/Linux
```

### Database connection fails

```bash
# Verify DATABASE_URL in .env
cat .env | grep DATABASE_URL

# Test database connection
npm run verify-schema

# For local PostgreSQL, check if it's running
brew services list  # macOS
sudo systemctl status postgresql  # Linux
```

### Cloudflared not found

```bash
# macOS
brew install cloudflared

# Linux
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb

# Windows
# Download from: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/
```

### Tunnel fails to start

**For named tunnels:**
```bash
# List your tunnels
cloudflared tunnel list

# If tunnel doesn't exist, create it
cloudflared tunnel create seasonal-bunker

# If not authenticated
cloudflared tunnel login
```

**For quick tunnels:**
- Just needs cloudflared installed, no authentication required
- If it fails, check internet connection

### Can't access from external network

- Verify tunnel is running (check terminal output)
- Test the URL in an incognito window
- Check Cloudflare dashboard for tunnel status
- Ensure application is running on port 3000

### Laptop goes to sleep

**macOS:**
```bash
# Prevent sleep while plugged in
sudo pmset -c sleep 0
sudo pmset -c disksleep 0

# Restore default
sudo pmset -c sleep 10
```

**Linux:**
```bash
# Prevent sleep
sudo systemctl mask sleep.target suspend.target

# Restore
sudo systemctl unmask sleep.target suspend.target
```

**Windows:**
- Settings → System → Power & Sleep → Set to "Never"

---

## Comparison: Local vs Neon Database

| Feature | Local PostgreSQL | Neon |
|---------|------------------|------|
| Setup | More complex | Simple |
| Cost | Free | Free (0.5 GB) |
| Backups | Manual | Automatic |
| Access | Only from laptop | From anywhere |
| Offline | Works offline | Requires internet |
| Performance | Fast (local) | Network latency |

**Recommendation:** Start with Neon for simplicity, switch to local if you need offline access.

---

## Comparison: Quick vs Named Tunnel

| Feature | Quick Tunnel | Named Tunnel |
|---------|--------------|--------------|
| Setup | Instant | 5 minutes |
| URL | Random | Custom domain |
| Persistence | Changes each time | Permanent |
| Authentication | None | Required |
| Best for | Testing, demos | Production, permanent |

**Recommendation:** Use quick tunnel for testing, named tunnel for permanent hosting.

---

## Next Steps

- **Set up admin:** Create user in `users` table
- **Configure settings:** Add row to `settings` table
- **Custom domain:** Configure named tunnel with your domain
- **Auto-start:** Set up PM2 or system service
- **Backups:** If using local PostgreSQL, set up automated backups

---

## Need More Details?

- **Cloudflare Tunnel setup:** [cloudflare-tunnel-setup.md](./cloudflare-tunnel-setup.md)
- **Database migrations:** [database-migration-guide.md](./database-migration-guide.md)
- **Environment variables:** [environment-variables.md](./environment-variables.md)
- **Scripts documentation:** [scripts/README.md](../scripts/README.md)
- **Compare with managed hosting:** [deployment-comparison.md](./deployment-comparison.md)

---

## When to Switch to Managed Hosting?

Consider Vercel + Neon if you:
- Want 24/7 uptime without keeping laptop on
- Need better reliability and performance
- Don't want to manage infrastructure
- Want automatic deployments from Git

See [quickstart-managed-hosting.md](./quickstart-managed-hosting.md) for the managed approach.

---

**Questions?** Check [scripts/README.md](../scripts/README.md) for detailed troubleshooting and the full self-hosting guide.
