#!/bin/bash

# Docker 빌드 테스트 스크립트

set -e

echo "================================"
echo "Docker Build Test Started"
echo "================================"

# Backend 빌드
echo ""
echo "[1/2] Building Backend..."
cd backend
docker build -t blog-backend:test .
echo "✓ Backend build successful!"

# Frontend 빌드
echo ""
echo "[2/2] Building Frontend..."
cd ../frontend
docker build --build-arg NEXT_PUBLIC_API_URL=http://localhost:3002 -t blog-frontend:test .
echo "✓ Frontend build successful!"

echo ""
echo "================================"
echo "Build Test Complete!"
echo "================================"
echo ""
echo "Images created:"
docker images | grep "blog-"

echo ""
echo "Next steps:"
echo "1. Test with Docker Compose: docker-compose -f docker-compose.test.yml up"
echo "2. Or run individually:"
echo "   docker run -p 3002:3002 blog-backend:test"
echo "   docker run -p 3000:3000 blog-frontend:test"
