#!/bin/bash

echo "🛑 Stopping Photo Selection App Docker Environment"

# Stop and remove containers
echo "📦 Stopping containers..."
docker-compose down

# Remove volumes for clean restart
echo "🗑️  Removing volumes for clean restart..."
docker volume rm photo-selection_postgres_data 2>/dev/null || echo "   ℹ️  PostgreSQL volume not found (already clean)"
docker volume rm photo-selection_redis_data 2>/dev/null || echo "   ℹ️  Redis volume not found (already clean)"

# Optional: Remove images (uncomment if you want to clean everything)
# echo "🧹 Removing Docker images..."
# docker rmi photo-selection-app 2>/dev/null || echo "   ℹ️  App image not found"

# Clean up any orphaned containers
echo "🧽 Cleaning up orphaned containers..."
docker container prune -f

echo "✅ Docker environment cleaned up!"
echo ""
echo "📋 Next steps:"
echo "   - Run 'npm run docker:dev' to start fresh environment"
echo "   - Or run './scripts/docker-dev.sh' directly"
echo ""
echo "🔍 Useful commands:"
echo "   - Check running containers: docker ps"
echo "   - Check volumes: docker volume ls"
echo "   - Check images: docker images"
