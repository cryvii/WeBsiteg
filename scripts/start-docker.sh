#!/bin/bash

# Start the application in production mode using Docker
echo "🚀 Starting Seasonal Bunker (Docker Production)..."

# Add common paths to PATH
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

# Ensure .env exists or use defaults
if [ ! -f .env ]; then
    echo "⚠️  .env file not found, using default environment variables from docker-compose.prod.yml"
fi

# Build and start containers
echo "📦 Building and starting containers using: $COMPOSE_CMD"
$COMPOSE_CMD -f docker-compose.prod.yml up -d --build

echo ""
echo "✅ Services started!"
echo "   App: http://localhost:3000"
echo ""
echo "📝 To view logs: $COMPOSE_CMD -f docker-compose.prod.yml logs -f"
echo "🛑 To stop: $COMPOSE_CMD -f docker-compose.prod.yml down"
