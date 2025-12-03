#!/bin/bash

# Seasonal Bunker - Quick Tunnel Startup Script
# This script starts the app with a quick Cloudflare tunnel (no tunnel setup required)

set -e  # Exit on error

echo "🚀 Starting Seasonal Bunker with Quick Tunnel..."
echo ""

# Check if cloudflared is installed
if ! command -v cloudflared &> /dev/null; then
    echo "❌ Error: cloudflared is not installed"
    echo ""
    echo "Please install cloudflared first:"
    echo "  macOS:   brew install cloudflared"
    echo "  Linux:   See https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/"
    echo ""
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found"
    echo "Please create a .env file with your DATABASE_URL"
    exit 1
fi

# Load environment variables
export $(cat .env | grep -v '^#' | xargs)

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
sleep 3

# Check if app is running
if ! kill -0 $APP_PID 2>/dev/null; then
    echo "❌ Error: Application failed to start"
    exit 1
fi

echo "   ✓ Application running on http://localhost:3000"
echo ""

echo "🔗 Starting Quick Cloudflare Tunnel..."
echo "   (This creates a temporary tunnel with a random URL)"
echo ""

# Start quick tunnel
cloudflared tunnel --url http://localhost:3000 &
TUNNEL_PID=$!

echo ""
echo "✅ Services started!"
echo ""
echo "📊 Status:"
echo "   Application: http://localhost:3000 (PID: $APP_PID)"
echo "   Tunnel:      Check output above for public URL"
echo ""
echo "🌍 Your application is now publicly accessible!"
echo "   Look for the 'trycloudflare.com' URL in the output above"
echo ""
echo "   Press Ctrl+C to stop both services"
echo ""

# Wait for both processes
wait $APP_PID $TUNNEL_PID
