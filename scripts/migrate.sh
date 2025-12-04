#!/bin/bash
# Run database migrations on Vercel deployment

echo "Running database migrations..."
npx drizzle-kit push --force
echo "Migrations complete!"
