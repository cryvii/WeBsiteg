# Design Document

## Overview

This design document outlines two deployment approaches for the Seasonal Bunker SvelteKit application:

1. **Managed Hosting Approach**: Deploy to Vercel with a Neon PostgreSQL database for a production-ready, zero-maintenance solution
2. **Self-Hosting Approach**: Run the application from a laptop using Cloudflare Tunnel for public access

Both approaches provide free hosting with full functionality. The managed approach offers better reliability and uptime, while the self-hosting approach provides more control and learning opportunities.

## Architecture

### Managed Hosting Architecture

```
User Browser
    ↓
Vercel Edge Network (CDN + Serverless Functions)
    ↓
SvelteKit Application (Node.js Serverless)
    ↓
Neon PostgreSQL Database (Managed)
```

**Components:**
- **Vercel**: Hosts the SvelteKit application as serverless functions with automatic scaling
- **Neon**: Provides a serverless PostgreSQL database with generous free tier (0.5 GB storage, autosuspend after inactivity)
- **Git Integration**: Automatic deployments on push to main branch

### Self-Hosting Architecture

```
User Browser
    ↓
Cloudflare Tunnel (Public URL)
    ↓
cloudflared daemon (Running on laptop)
    ↓
SvelteKit Application (Node.js on localhost:3000)
    ↓
PostgreSQL (Local or Neon)
```

**Components:**
- **Cloudflare Tunnel**: Creates a secure tunnel from laptop to public internet without port forwarding
- **Local Node.js Server**: Runs the built SvelteKit application
- **PostgreSQL**: Either local installation or Neon database
- **cloudflared**: Lightweight daemon that maintains the tunnel connection

## Components and Interfaces

### 1. SvelteKit Adapter Configuration

**Current State**: The application uses `@sveltejs/adapter-node` which is suitable for both deployment approaches.

**For Managed Hosting (Vercel)**:
- Switch to `@sveltejs/adapter-vercel` for optimal Vercel integration
- Enables edge functions and serverless optimizations
- Automatic static asset optimization

**For Self-Hosting**:
- Keep `@sveltejs/adapter-node` 
- Builds a standalone Node.js server
- Simple to run with `node build/index.js`

### 2. Database Connection Management

**Connection String Format**:
```
postgresql://[user]:[password]@[host]:[port]/[database]?sslmode=require
```

**Environment Variables**:
- `DATABASE_URL`: Full PostgreSQL connection string
- Loaded via `process.env.DATABASE_URL` in `src/lib/server/db/index.ts`

**Connection Pooling**:
- Drizzle ORM with postgres.js handles connection pooling automatically
- Neon supports up to 100 concurrent connections on free tier
- Local PostgreSQL default is 100 connections

### 3. Environment Variable Management

**Managed Hosting (Vercel)**:
- Set via Vercel dashboard or CLI
- Encrypted at rest
- Available to serverless functions at runtime
- Can set different values for production/preview/development

**Self-Hosting**:
- Use `.env` file (already present in project)
- Ensure `.env` is in `.gitignore`
- Load via Vite's built-in env handling

### 4. Build and Deployment Process

**Managed Hosting Build**:
```bash
npm install
npm run build
# Vercel automatically detects SvelteKit and runs appropriate commands
```

**Self-Hosting Build**:
```bash
npm install
npm run build
node build/index.js
```

### 5. Tunnel Service Configuration

**Cloudflare Tunnel Setup**:
- Install `cloudflared` CLI
- Authenticate with Cloudflare account (free)
- Create tunnel: `cloudflared tunnel create seasonal-bunker`
- Configure tunnel to point to `localhost:3000`
- Run tunnel: `cloudflared tunnel run seasonal-bunker`

**Alternative Tunnel Services**:
- **ngrok**: Simple setup, free tier includes 1 tunnel, random URLs (paid for custom domains)
- **localtunnel**: Completely free, less reliable, random URLs
- **Cloudflare Tunnel**: Best free option, custom domains, reliable, no bandwidth limits

## Data Models

The existing data models remain unchanged:

- **users**: Admin authentication
- **settings**: Global commission settings (singleton)
- **commissions**: Commission requests and their status

Database schema is defined in `src/lib/server/db/schema.ts` using Drizzle ORM.


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Example 1: Application Accessibility
When the application is deployed (either managed or self-hosted), making an HTTP request to the application URL should return a successful response (HTTP 200) with the expected HTML content.
**Validates: Requirements 1.1, 1.2, 7.1**

### Example 2: Database Connectivity
When the application starts with a valid DATABASE_URL environment variable, the application should successfully connect to the PostgreSQL database and execute a simple query without errors.
**Validates: Requirements 2.1, 2.2, 2.4, 8.1**

### Example 3: Data Persistence
When data is written to the database (e.g., creating a commission), then querying for that data should return the same values that were written.
**Validates: Requirements 2.3, 8.4, 6.5**

### Example 4: Build Success
When the build command (`npm run build`) is executed, it should complete with exit code 0 and produce the expected build output directory.
**Validates: Requirements 3.1, 3.5**

### Example 5: Build Artifacts Present
When the build completes successfully, the build output directory should contain the compiled application files and any static assets from the `static/` directory.
**Validates: Requirements 3.2, 3.4**

### Example 6: Environment Variable Access
When the application starts, it should be able to access the DATABASE_URL environment variable and use it to establish a database connection.
**Validates: Requirements 4.1, 4.2**

### Example 7: Environment Variable Security
When the application serves pages to the client, environment variables (especially DATABASE_URL) should not be exposed in the client-side JavaScript bundle or HTML source.
**Validates: Requirements 4.3, 4.5**

### Example 8: Schema Initialization
When database migrations are executed on a fresh database, all required tables (users, settings, commissions) and enums (status) should be created with the correct schema structure.
**Validates: Requirements 6.1, 6.2, 6.3, 6.4**

### Example 9: Connection String Format
When connecting to a local PostgreSQL database, the connection string should use the localhost format (`postgresql://user:password@localhost:5432/dbname`) and successfully establish a connection.
**Validates: Requirements 8.2**

## Error Handling

### Build Errors
- **Invalid Adapter Configuration**: If the adapter is misconfigured, the build should fail with a clear error message
- **Missing Dependencies**: If required packages are not installed, provide clear npm install instructions
- **TypeScript Errors**: Build should fail if there are type errors, preventing deployment of broken code

### Database Errors
- **Connection Failures**: If DATABASE_URL is invalid or database is unreachable, log clear error and fail gracefully
- **Migration Failures**: If migrations fail, rollback changes and report which migration failed
- **Query Errors**: Catch and log database query errors with context about the operation

### Runtime Errors
- **Missing Environment Variables**: Check for required env vars on startup and fail fast with helpful message
- **Port Already in Use**: For self-hosting, detect port conflicts and suggest alternatives
- **Tunnel Connection Failures**: For self-hosting, provide clear feedback if tunnel service is unreachable

### Deployment Errors
- **Vercel Build Failures**: Provide build logs and common solutions (e.g., Node version mismatch)
- **Database Connection from Vercel**: Ensure Neon allows connections from Vercel's IP ranges
- **Environment Variable Sync**: Verify all required env vars are set in deployment platform

## Testing Strategy

### Manual Testing Approach

Since this is a deployment and infrastructure feature rather than application logic, testing will primarily be manual and verification-based:

**Build Verification Tests**:
- Run `npm run build` and verify exit code 0
- Check that `build/` directory is created with expected structure
- Verify static assets are included in build output
- Test with both adapter-node and adapter-vercel

**Local Development Tests**:
- Start application locally with `npm run dev`
- Verify application loads at `http://localhost:5173`
- Test database connectivity with local PostgreSQL
- Verify environment variables are loaded from `.env`

**Managed Hosting Tests (Vercel + Neon)**:
- Deploy to Vercel and verify public URL is accessible
- Test database operations work through Vercel deployment
- Verify environment variables are properly configured
- Test automatic deployments on git push
- Verify build logs for any warnings or errors

**Self-Hosting Tests (Cloudflare Tunnel)**:
- Build and run application locally on port 3000
- Start Cloudflare Tunnel and verify public URL
- Test that external users can access the application
- Verify database operations work through tunnel
- Test tunnel reconnection after network interruption

**Database Migration Tests**:
- Run migrations on fresh database: `npx drizzle-kit push`
- Verify all tables are created: users, settings, commissions
- Verify status enum is created
- Insert test data and verify persistence
- Run migrations again and verify idempotency

**Security Tests**:
- Inspect client-side JavaScript bundle for exposed secrets
- Verify `.env` is in `.gitignore`
- Check that DATABASE_URL is not logged in application output
- Verify Neon database requires SSL connections

**Integration Tests**:
- Test full user flow: visit site → view commissions → submit commission
- Verify admin authentication works
- Test commission status updates persist correctly
- Verify settings changes are saved

### Test Execution Order

1. **Local Build Tests**: Verify the application builds correctly
2. **Local Runtime Tests**: Verify the application runs locally
3. **Database Tests**: Verify migrations and data operations
4. **Managed Hosting Tests**: Deploy to Vercel + Neon
5. **Self-Hosting Tests**: Set up Cloudflare Tunnel
6. **Security Tests**: Verify no secrets are exposed
7. **Integration Tests**: Test end-to-end functionality

### Success Criteria

The deployment is considered successful when:
- Application builds without errors
- Public URL is accessible and returns the application
- Database operations (create, read, update) work correctly
- No environment variables are exposed to clients
- Documentation is complete and accurate
- Both deployment methods are verified working

## Implementation Notes

### Adapter Selection

**For Managed Hosting (Vercel)**:
```javascript
// svelte.config.js
import adapter from '@sveltejs/adapter-vercel';
```

**For Self-Hosting**:
```javascript
// svelte.config.js
import adapter from '@sveltejs/adapter-node';
```

The application can support both by having two configuration files or by using an environment variable to switch adapters.

### Database Connection Best Practices

**Connection String Validation**:
```typescript
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}
```

**SSL Configuration for Neon**:
```typescript
const client = postgres(process.env.DATABASE_URL, {
  ssl: 'require'
});
```

### Cloudflare Tunnel Configuration

**Create tunnel**:
```bash
cloudflared tunnel create seasonal-bunker
```

**Configure tunnel** (`~/.cloudflared/config.yml`):
```yaml
tunnel: <tunnel-id>
credentials-file: /path/to/<tunnel-id>.json

ingress:
  - hostname: seasonal-bunker.yourdomain.com
    service: http://localhost:3000
  - service: http_status:404
```

**Run tunnel**:
```bash
cloudflared tunnel run seasonal-bunker
```

### Environment Variables Required

**Both Approaches**:
- `DATABASE_URL`: PostgreSQL connection string

**Vercel Specific**:
- Automatically sets `VERCEL`, `VERCEL_ENV`, `VERCEL_URL`

**Self-Hosting Specific**:
- `PORT`: Port to run the application (default: 3000)
- `HOST`: Host to bind to (default: 0.0.0.0)

### Deployment Checklist

**Managed Hosting (Vercel + Neon)**:
1. Create Neon account and database
2. Copy DATABASE_URL from Neon dashboard
3. Install Vercel CLI: `npm i -g vercel`
4. Run `vercel` in project directory
5. Set DATABASE_URL in Vercel dashboard
6. Push to git to trigger deployment
7. Run migrations: `npx drizzle-kit push` (with DATABASE_URL set)

**Self-Hosting (Cloudflare Tunnel)**:
1. Install PostgreSQL locally or use Neon
2. Set DATABASE_URL in `.env` file
3. Run migrations: `npx drizzle-kit push`
4. Build application: `npm run build`
5. Install cloudflared
6. Create and configure tunnel
7. Start application: `node build/index.js`
8. Start tunnel: `cloudflared tunnel run seasonal-bunker`

## Alternative Platforms Considered

### Managed Hosting Alternatives

**Render**:
- Pros: Simple setup, free PostgreSQL included, good documentation
- Cons: Free tier spins down after inactivity (slow cold starts)
- Verdict: Good alternative to Vercel

**Railway**:
- Pros: Excellent developer experience, includes database
- Cons: Free tier recently reduced, $5/month credit
- Verdict: Good but not truly free anymore

**Fly.io**:
- Pros: Global edge deployment, includes PostgreSQL
- Cons: Complex configuration, requires credit card
- Verdict: Overkill for this project

**Netlify**:
- Pros: Great for static sites, good CI/CD
- Cons: Serverless functions have limitations for SvelteKit
- Verdict: Not ideal for this application

### Tunnel Service Alternatives

**ngrok**:
- Pros: Very simple setup, reliable
- Cons: Free tier has random URLs, limited to 1 tunnel
- Verdict: Good for testing, not ideal for permanent hosting

**localtunnel**:
- Pros: Completely free, no account needed
- Cons: Less reliable, random URLs, can be slow
- Verdict: Good for quick tests only

**Tailscale Funnel**:
- Pros: Secure, part of Tailscale network
- Cons: Requires Tailscale setup, more complex
- Verdict: Overkill for simple hosting

### Recommendation

**For Production/Permanent Hosting**: Vercel + Neon
- Most reliable
- Best performance
- Automatic deployments
- Zero maintenance

**For Learning/Development**: Cloudflare Tunnel + Local PostgreSQL
- Full control
- Learn about networking and tunneling
- No platform lock-in
- Can switch to Neon database if local setup is too complex
