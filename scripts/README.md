# Scripts

This directory contains utility scripts for the Seasonal Bunker application.

## Available Scripts

### verify-schema.ts

Verifies that the database schema matches the expected structure after running migrations.

**Usage:**
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
- After running migrations (`npx drizzle-kit push`)
- When troubleshooting database issues
- Before deploying to production
- After schema changes

### verify-deployment.ts

Comprehensive verification of a managed hosting deployment (Vercel + Neon).

**Usage:**
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

### verify-self-hosting.ts

Verification script for self-hosted deployments.

**Usage:**
```bash
# Verify with default URL (localhost:3000)
npm run verify-self-hosting

# Verify with custom URL (e.g., after tunnel setup)
npm run verify-self-hosting -- --url https://your-tunnel-url.com
```

**What it checks:**
- Application accessibility
- Database connectivity
- Data persistence (insert/query round-trip)
- Connection string format (localhost vs remote)

**When to use:**
- After starting the application locally
- Before setting up Cloudflare Tunnel
- When troubleshooting self-hosting issues
- To verify database configuration

**Requirements:**
- Application must be running (use `./scripts/start-app.sh`)
- `.env` file with `DATABASE_URL` configured
- Database must be accessible

### verify-env-security.ts

Verification script for environment variable security.

**Usage:**
```bash
npm run verify-env-security
```

**What it checks:**
- `.env` is properly listed in `.gitignore`
- `.env.example` exists and doesn't contain real credentials
- Environment variables documentation exists with security warnings
- Build output doesn't expose secrets (DATABASE_URL, connection strings)

**When to use:**
- Before committing code to version control
- After adding new environment variables
- Before deploying to production
- As part of security audits
- When onboarding new team members

**Requirements:**
- `.env.example` file should exist
- `.gitignore` should include `.env`
- Build output (optional, will warn if not present)

**Validates:** Requirements 4.3, 4.5 - Environment Variable Security

### start-app.sh

Shell script to build and start the application for self-hosting.

**Usage:**
```bash
./scripts/start-app.sh
```

**What it does:**
- Checks for `.env` file and `DATABASE_URL`
- Installs dependencies
- Builds the application
- Starts the Node.js server on port 3000

**When to use:**
- When self-hosting the application
- For local production testing
- When you want to run just the app (without tunnel)

**Requirements:**
- `.env` file with `DATABASE_URL` configured
- Node.js 18+ installed

### start-with-tunnel.sh

Shell script to start both the application and Cloudflare Tunnel together.

**Usage:**
```bash
# Using default tunnel name (seasonal-bunker)
./scripts/start-with-tunnel.sh

# Using custom tunnel name
./scripts/start-with-tunnel.sh my-tunnel-name
```

**What it does:**
- Checks for `cloudflared` installation
- Builds and starts the application
- Starts a named Cloudflare Tunnel
- Manages both processes together
- Handles graceful shutdown with Ctrl+C

**When to use:**
- When you have a configured Cloudflare Tunnel
- For permanent self-hosting setup
- When you want a custom domain

**Requirements:**
- `cloudflared` installed and authenticated
- Named tunnel created (see setup below)
- `.env` file with `DATABASE_URL`

**Setup:**
```bash
# Install cloudflared
brew install cloudflared  # macOS

# Authenticate
cloudflared tunnel login

# Create tunnel
cloudflared tunnel create seasonal-bunker

# Configure tunnel (optional, for custom domain)
# Edit ~/.cloudflared/config.yml
```

### start-with-quick-tunnel.sh

Shell script to start the application with a quick temporary Cloudflare Tunnel.

**Usage:**
```bash
./scripts/start-with-quick-tunnel.sh
```

**What it does:**
- Builds and starts the application
- Creates a temporary Cloudflare Tunnel with random URL
- No tunnel setup or authentication required
- Perfect for quick testing

**When to use:**
- Quick testing or demos
- When you don't want to set up a named tunnel
- For temporary public access

**Requirements:**
- `cloudflared` installed (no authentication needed)
- `.env` file with `DATABASE_URL`

**Note:** The URL will be random (e.g., `https://random-name.trycloudflare.com`) and changes each time you run the script.

## Environment Variables

All scripts require the following environment variables:

- `DATABASE_URL`: PostgreSQL connection string

Set these in your `.env` file or environment before running the scripts.

## Running on System Startup (Optional)

If you want the application to start automatically when your computer boots, you can set up a system service.

### macOS (using launchd)

1. Create a launch agent file:

```bash
nano ~/Library/LaunchAgents/com.seasonalbunker.app.plist
```

2. Add the following content (adjust paths as needed):

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.seasonalbunker.app</string>
    <key>ProgramArguments</key>
    <array>
        <string>/bin/bash</string>
        <string>/path/to/your/project/scripts/start-with-tunnel.sh</string>
    </array>
    <key>WorkingDirectory</key>
    <string>/path/to/your/project</string>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/tmp/seasonalbunker.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/seasonalbunker.error.log</string>
</dict>
</plist>
```

3. Load the launch agent:

```bash
launchctl load ~/Library/LaunchAgents/com.seasonalbunker.app.plist
```

4. To stop the service:

```bash
launchctl unload ~/Library/LaunchAgents/com.seasonalbunker.app.plist
```

### Linux (using systemd)

1. Create a systemd service file:

```bash
sudo nano /etc/systemd/system/seasonal-bunker.service
```

2. Add the following content (adjust paths and user):

```ini
[Unit]
Description=Seasonal Bunker Application
After=network.target

[Service]
Type=simple
User=your-username
WorkingDirectory=/path/to/your/project
ExecStart=/bin/bash /path/to/your/project/scripts/start-with-tunnel.sh
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

3. Enable and start the service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable seasonal-bunker
sudo systemctl start seasonal-bunker
```

4. Check status:

```bash
sudo systemctl status seasonal-bunker
```

5. View logs:

```bash
sudo journalctl -u seasonal-bunker -f
```

### Windows (using Task Scheduler)

1. Open Task Scheduler
2. Click "Create Basic Task"
3. Name: "Seasonal Bunker"
4. Trigger: "When the computer starts"
5. Action: "Start a program"
6. Program: `C:\Program Files\Git\bin\bash.exe` (or your bash path)
7. Arguments: `/path/to/your/project/scripts/start-with-tunnel.sh`
8. Start in: `/path/to/your/project`
9. Finish and test

### Important Notes

- **Database:** Ensure your database (PostgreSQL) also starts on boot
- **Environment Variables:** Make sure `.env` file is present and readable
- **Logs:** Check the log files if the service doesn't start
- **Permissions:** Ensure the scripts have execute permissions
- **Testing:** Test the scripts manually before setting up auto-start

### Alternative: Using PM2 (Cross-Platform)

PM2 is a process manager that works on all platforms:

1. Install PM2:
```bash
npm install -g pm2
```

2. Create an ecosystem file `ecosystem.config.js`:
```javascript
module.exports = {
  apps: [{
    name: 'seasonal-bunker',
    script: './build/index.js',
    cwd: '/path/to/your/project',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
```

3. Start with PM2:
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # Follow the instructions to enable startup
```

4. Manage the process:
```bash
pm2 status          # Check status
pm2 logs            # View logs
pm2 restart all     # Restart
pm2 stop all        # Stop
```

## Troubleshooting

If scripts fail to run:

1. Ensure dependencies are installed: `npm install`
2. Ensure `.env` file exists with `DATABASE_URL`
3. Ensure database is accessible
4. Check that `tsx` is installed (it's in devDependencies)
5. Verify scripts have execute permissions: `chmod +x scripts/*.sh`
6. Check for port conflicts (port 3000 must be available)

### Common Issues

**"cloudflared: command not found"**
- Install cloudflared: `brew install cloudflared` (macOS)
- Or download from: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/

**"DATABASE_URL not found"**
- Create `.env` file in project root
- Add: `DATABASE_URL=your-connection-string`

**"Port 3000 already in use"**
- Stop other services using port 3000
- Or modify the port in the application

**"Tunnel failed to start"**
- For named tunnels: Ensure tunnel is created and authenticated
- For quick tunnels: Just needs cloudflared installed
- Check cloudflared logs for details

For more detailed troubleshooting, see:
- [Database Migration Guide](../docs/database-migration-guide.md)
- [Deployment Documentation](../docs/deployment-managed-hosting.md)
