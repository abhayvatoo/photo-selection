#!/bin/bash

# Docker Production Setup Script
echo "🐳 Starting Photo Selection App Production Environment"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop and try again."
    exit 1
fi

# Build and start all services
echo "🏗️ Building and starting all services..."
docker-compose up --build -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
until docker exec photo-selection-db pg_isready -U photo_user -d photo_selection_db; do
  echo "Database is not ready yet..."
  sleep 2
done

echo "✅ All services are ready!"

echo "🎉 Production environment is running!"
echo ""
echo "📋 Service URLs:"
echo "   - Application: http://localhost:3000"
echo "   - Socket.io: http://localhost:3001"
echo "   - PostgreSQL: localhost:5432"
echo "   - Redis: localhost:6379"
echo ""
echo "🛠️ Useful commands:"
echo "   - View logs: docker-compose logs -f"
echo "   - Stop services: docker-compose down"
echo "   - Restart services: docker-compose restart"
echo "   - Connect to database: docker exec -it photo-selection-db psql -U photo_user -d photo_selection_db"
