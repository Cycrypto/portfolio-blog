#!/bin/bash

# GCP 수동 배포 스크립트
# 사용법: ./scripts/gcp-manual-deploy.sh [PROJECT_ID] [REGION]

set -e

# ============================================
# 설정
# ============================================
PROJECT_ID=${1:-"your-project-id"}
REGION=${2:-"asia-northeast3"}
FRONTEND_SERVICE="blog-frontend"
BACKEND_SERVICE="blog-backend"

echo "================================"
echo "GCP Manual Deployment"
echo "================================"
echo "Project ID: $PROJECT_ID"
echo "Region: $REGION"
echo ""

# ============================================
# GCP 인증 확인
# ============================================
echo "[Step 1/8] Checking GCP authentication..."
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo "Error: Not authenticated with GCP"
    echo "Please run: gcloud auth login"
    exit 1
fi
echo "✓ Authenticated"

# ============================================
# 프로젝트 설정
# ============================================
echo ""
echo "[Step 2/8] Setting GCP project..."
gcloud config set project $PROJECT_ID
echo "✓ Project set to $PROJECT_ID"

# ============================================
# API 활성화
# ============================================
echo ""
echo "[Step 3/8] Enabling required APIs..."
gcloud services enable \
    run.googleapis.com \
    cloudbuild.googleapis.com \
    artifactregistry.googleapis.com \
    sqladmin.googleapis.com
echo "✓ APIs enabled"

# ============================================
# Artifact Registry 생성 (이미 있으면 skip)
# ============================================
echo ""
echo "[Step 4/8] Creating Artifact Registry..."
gcloud artifacts repositories create blog-images \
    --repository-format=docker \
    --location=$REGION \
    --description="Blog Docker images" \
    2>/dev/null || echo "Repository already exists, skipping..."
echo "✓ Artifact Registry ready"

# ============================================
# Docker 인증 설정
# ============================================
echo ""
echo "[Step 5/8] Configuring Docker authentication..."
gcloud auth configure-docker ${REGION}-docker.pkg.dev
echo "✓ Docker authenticated"

# ============================================
# Backend 빌드 및 푸시
# ============================================
echo ""
echo "[Step 6/8] Building and pushing Backend..."
cd backend
docker build -t ${REGION}-docker.pkg.dev/${PROJECT_ID}/blog-images/backend:latest .
docker push ${REGION}-docker.pkg.dev/${PROJECT_ID}/blog-images/backend:latest
echo "✓ Backend image pushed"

# ============================================
# Frontend 빌드 및 푸시
# ============================================
echo ""
echo "[Step 7/8] Building and pushing Frontend..."
cd ../frontend

# API URL 입력 받기
read -p "Enter NEXT_PUBLIC_API_URL (e.g., https://api.yourblog.com): " API_URL
if [ -z "$API_URL" ]; then
    API_URL="http://localhost:3002"
    echo "Using default: $API_URL"
fi

docker build --build-arg NEXT_PUBLIC_API_URL=$API_URL \
    -t ${REGION}-docker.pkg.dev/${PROJECT_ID}/blog-images/frontend:latest .
docker push ${REGION}-docker.pkg.dev/${PROJECT_ID}/blog-images/frontend:latest
echo "✓ Frontend image pushed"

# ============================================
# Cloud Run 배포
# ============================================
echo ""
echo "[Step 8/8] Deploying to Cloud Run..."

# Backend 배포
echo "Deploying Backend..."
gcloud run deploy $BACKEND_SERVICE \
    --image ${REGION}-docker.pkg.dev/${PROJECT_ID}/blog-images/backend:latest \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --min-instances 0 \
    --max-instances 5 \
    --cpu 1 \
    --memory 512Mi \
    --timeout 300 \
    --set-env-vars NODE_ENV=production

echo "✓ Backend deployed"

# Backend URL 가져오기
BACKEND_URL=$(gcloud run services describe $BACKEND_SERVICE --region $REGION --format='value(status.url)')
echo "Backend URL: $BACKEND_URL"

# Frontend 배포
echo ""
echo "Deploying Frontend..."
gcloud run deploy $FRONTEND_SERVICE \
    --image ${REGION}-docker.pkg.dev/${PROJECT_ID}/blog-images/frontend:latest \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --min-instances 0 \
    --max-instances 10 \
    --cpu 1 \
    --memory 512Mi \
    --timeout 300 \
    --set-env-vars NODE_ENV=production,NEXT_PUBLIC_API_URL=$BACKEND_URL

echo "✓ Frontend deployed"

# Frontend URL 가져오기
FRONTEND_URL=$(gcloud run services describe $FRONTEND_SERVICE --region $REGION --format='value(status.url)')

# ============================================
# 완료
# ============================================
echo ""
echo "================================"
echo "Deployment Complete! 🚀"
echo "================================"
echo ""
echo "Frontend URL: $FRONTEND_URL"
echo "Backend URL:  $BACKEND_URL"
echo ""
echo "Health checks:"
echo "  curl $FRONTEND_URL/api/health"
echo "  curl $BACKEND_URL/"
echo ""
echo "View logs:"
echo "  gcloud run logs read $FRONTEND_SERVICE --region $REGION"
echo "  gcloud run logs read $BACKEND_SERVICE --region $REGION"
