Self-hosting guide for Seasonal Bunker

Overview

This document explains how to run the app locally and in production using Docker Compose. The repository already includes `Dockerfile.prod` and `docker-compose.prod.yml`.

Prerequisites

- Docker and Docker Compose installed
- A machine reachable by your friend (or a VPS) and optionally a reverse proxy / domain

Quick local dev (recommended for testing)

1. Start PostgreSQL and app (dev mode) using the provided `docker-compose.yml`:

```bash
# from repo root
docker compose up -d
```

2. Run migrations (requires `drizzle-kit`):

```bash
# Ensure node deps are installed locally or run inside the container
npm ci
./scripts/migrate.sh
```

3. Start the dev server (if not started by the compose service):

```bash
npm run dev
```

4. Test the API with the provided script:

```bash
node scripts/test_commission.js http://localhost:5173/api/commission
```

Production (Docker Compose)

1. Create an env file, e.g. `.env.production` (see `.env.production.example`):

```text
DATABASE_URL=postgres://user:password@db:5432/bunker
POSTGRES_USER=user
POSTGRES_PASSWORD=password
POSTGRES_DB=bunker
ORIGIN=http://your-domain-or-ip:3000
```

2. Build and start the stack:

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

3. Run migrations (run from a machine with the `drizzle-kit` binary and `DATABASE_URL` pointing to the DB):

```bash
# from repo root or from a migration container
./scripts/migrate.sh
```

4. Open `http://your-domain-or-ip:3000` and test the `/commissions` form.

Exposing to the internet

- If deploying to a VPS, point your DNS to the server and use a reverse proxy (nginx, Traefik) and TLS certificates (Let's Encrypt).
- If using a home machine, consider using Cloudflare Tunnel or ngrok for quick sharing.

Troubleshooting

- If submissions fail, check container logs:

```bash
docker compose -f docker-compose.prod.yml logs -f app
```

- Check the database connectivity and migration status. Look for errors in `build/server` logs.

If you want, I can also prepare an nginx reverse-proxy example or a `docker-compose` + Traefik setup with automatic Let's Encrypt certificates. Let me know which you'd prefer.
