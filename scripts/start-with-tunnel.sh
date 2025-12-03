#!/bin/bash

# Seasonal Bunker - Application + Cloudflare Tunnel Startup Script
# This script starts both the application and Cloudflare Tunnel together

set -e  # Exit on error

echo "🚀 Starting Seasonal Bunker with Cloudflare Tunnel..."
echo ""

# Check if cloudflared is installed
if ! command -v cloudflared &> /dev/null; then
    echo "❌ Error: cloudflared is not installed"
    echo ""
    echo "Please install cloudflared first:"
    echo "  macOS:   brew install cloudflared"
    echo "  Linux:   See https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/"
    echo "  Windows: See https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/"
    echo ""
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found"
    echo "Please create a .env file with your DATABASE_URL"
    echo ""
    echo "Example:"
    echo "  DATABASE_URL=postgresql://user:password@localhost:5432/seasonal_bunker"
    echo ""
    exit 1
fi

# Check if DATABASE_URL is set
if ! grep -q "DATABASE_URL" .env; then
    echo "⚠️  Warning: DATABASE_URL not found in .env file"
    echo "Please add your database connection string to .env"
    exit 1
fi

# Load environment variables
export $(cat .env | grep -v '^#' | xargs)

# Check if tunnel name is provided
TUNNEL_NAME="${1:-seasonal-bunker}"

echo "📦 Installing dependencies..."
npm install

echo ""
echo "🔨 Building application..."
npm run build

echo ""
echo "✅ Build complete!"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down..."
    kill $APP_PID 2>/dev/null || true
    kill $TUNNEL_PID 2>/dev/null || true
    exit 0
}

trap cleanup SIGINT SIGTERM

echo "🌐 Starting application server..."
node build/index.js &
APP_PID=$!

# Wait for app to start
echo "   Waiting for application to start..."
sleep 3

# Check if app is running
if ! kill -0 $APP_PID 2>/dev/null; then
    echo "❌ Error: Application failed to start"
    exit 1
fi

echo "   ✓ Application running on http://localhost:3000"
echo ""

echo "🔗 Starting Cloudflare Tunnel..."
echo "   Tunnel name: $TUNNEL_NAME"
echo ""

# Start tunnel
cloudflared tunnel --url http://localhost:3000 run $TUNNEL_NAME &
TUNNEL_PID=$!

# Wait for tunnel to start
sleep 2

# Check if tunnel is running
if ! kill -0 $TUNNEL_PID 2>/dev/null; then
    echo "❌ Error: Tunnel failed to start"
    echo ""
    echo "Possible issues:"
    echo "  1. Tunnel '$TUNNEL_NAME' doesn't exist"
    echo "  2. Not authenticated with Cloudflare"
    echo ""
    echo "To create a tunnel:"
    echo "  cloudflared tunnel login"
    echo "  cloudflared tunnel create $TUNNEL_NAME"
    echo ""
    echo "For quick testing without a named tunnel, use:"
    echo "  cloudflared tunnel --url http://localhost:3000"
    echo ""
    kill $APP_PID 2>/dev/null || true
    exit 1
fi

echo ""
echo "✅ Both services are running!"
echo ""
echo "📊 Status:"
echo "   Application: http://localhost:3000 (PID: $APP_PID)"
echo "   Tunnel:      Active (PID: $TUNNEL_PID)"
echo ""
echo "🌍 Your application is now publicly accessible via Cloudflare Tunnel"
echo ""
echo "   Press Ctrl+C to stop both services"
echo ""

# Wait for both processes
wait $APP_PID $TUNNEL_PID
