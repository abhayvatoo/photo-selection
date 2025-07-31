#!/bin/bash

# Docker Development Setup Script
echo "🐳 Starting Photo Selection App Development Environment"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop and try again."
    exit 1
fi

# Start the development database
echo "📦 Starting PostgreSQL database..."
docker-compose up -d postgres redis

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
until docker exec photo-selection-db-dev pg_isready -U photo_user -d photo_selection_db; do
  echo "Database is not ready yet..."
  sleep 2
done

echo "✅ Database is ready!"

# Load environment variables
if [ -f .env.local ]; then
    export $(cat .env.local | grep -v '^#' | xargs)
fi

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npm run db:generate

# Run database migrations
echo "🗄️ Running database migrations..."
npm run db:push

# Seed the database
echo "🌱 Seeding database with sample data..."
npm run db:seed

echo "🎉 Development environment is ready!"
echo ""
echo "📋 Next steps:"
echo "   1. Run 'npm run dev' to start the development server"
echo "   2. Open http://localhost:3000 in your browser"
echo "   3. The app will use the Docker PostgreSQL database"
echo ""
echo "🛠️ Useful commands:"
echo "   - Stop database: docker-compose -f docker-compose.dev.yml down"
echo "   - View database logs: docker logs photo-selection-db-dev"
echo "   - Connect to database: docker exec -it photo-selection-db-dev psql -U photo_user -d photo_selection_db"
