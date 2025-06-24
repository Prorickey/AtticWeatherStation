#!/bin/sh

echo "Starting Attic Weather Station..."

# Wait for database to be ready
echo "Waiting for database to be ready..."
until npx prisma db push --accept-data-loss 2>/dev/null; do
  echo "Database not ready, waiting 2 seconds..."
  sleep 2
done

echo "Database is ready!"

# Run Prisma migrations
echo "Running Prisma database migrations..."
npx prisma db push --accept-data-loss

# Generate Prisma client (in case it's needed)
echo "Generating Prisma client..."
npx prisma generate

echo "Database setup complete. Starting server..."

# Start the Next.js server
exec node server.js
