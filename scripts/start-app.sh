#!/bin/bash

# Seasonal Bunker - Application Startup Script
# This script builds and starts the application for self-hosting

set -e  # Exit on error

echo "🚀 Starting Seasonal Bunker application..."
echo ""

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

echo "📦 Installing dependencies..."
npm install

echo ""
echo "🔨 Building application..."
npm run build

echo ""
echo "✅ Build complete!"
echo ""
echo "🌐 Starting server..."
echo "   Application will be available at: http://localhost:3000"
echo ""
echo "   Press Ctrl+C to stop the server"
echo ""

# Start the application
node build/index.js
