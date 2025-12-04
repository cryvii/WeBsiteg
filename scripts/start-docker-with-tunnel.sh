#!/bin/bash

# Start the application in Docker and expose it via Cloudflare Tunnel
echo "🚀 Starting Seasonal Bunker (Docker + Tunnel)..."

# Add common paths to PATH to ensure we find docker/cloudflared
export PATH=$PATH:/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin:/usr/sbin:/sbin

# Helper to find docker compose command
get_compose_cmd() {
    if command -v docker-compose &> /dev/null; then
        echo "docker-compose"
    elif docker compose version &> /dev/null; then
        echo "docker compose"
    else
        echo ""
    fi
}

COMPOSE_CMD=$(get_compose_cmd)

if [ -z "$COMPOSE_CMD" ]; then
    echo "⚠️  Warning: Could not detect 'docker-compose' or 'docker compose'."
    echo "   Will attempt to proceed with 'docker-compose', but it may fail."
    COMPOSE_CMD="docker-compose"
fi

if ! command -v cloudflared &> /dev/null; then
    echo "❌ Error: cloudflared is not installed"
    echo "Please install it: brew install cloudflared"
    exit 1
fi

# Ensure .env exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found, using default environment variables"
fi

# 1. Start Docker Containers
echo "📦 Starting Docker containers using: $COMPOSE_CMD"
$COMPOSE_CMD -f docker-compose.prod.yml up -d --build

echo "⏳ Waiting for application to be ready..."
sleep 5

# 2. Start Tunnel
echo "🔗 Creating temporary public tunnel..."
echo "   (Press Ctrl+C to stop)"
echo ""
# Force HTTP2 protocol to avoid QUIC/UDP blocking issues
cloudflared tunnel --protocol http2 --url http://localhost:3000
