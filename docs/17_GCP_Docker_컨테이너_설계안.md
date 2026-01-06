# GCP Docker 컨테이너 설계안

## 목표
Google Cloud Platform에 배포하기 위한 최적화된 Docker 컨테이너 이미지 설계

---

## 컨테이너 아키텍처 개요

### 전체 구조
```
┌─────────────────────────────────────────────────┐
│  Google Cloud Platform                          │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │  Cloud Run (Frontend)                     │ │
│  │  - Next.js Container                      │ │
│  │  - Port: 3000                             │ │
│  │  - Auto-scaling: 0-10 instances           │ │
│  └───────────────────────────────────────────┘ │
│                      │                          │
│                      ▼                          │
│  ┌───────────────────────────────────────────┐ │
│  │  Cloud Run (Backend)                      │ │
│  │  - NestJS Container                       │ │
│  │  - Port: 3002                             │ │
│  │  - Auto-scaling: 0-5 instances            │ │
│  └───────────────────────────────────────────┘ │
│                      │                          │
│                      ▼                          │
│  ┌───────────────────────────────────────────┐ │
│  │  Cloud SQL (PostgreSQL)                   │ │
│  │  - PostgreSQL 15                          │ │
│  │  - Private IP                             │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │  Cloud Storage (Images)                   │ │
│  │  - Public bucket                          │ │
│  │  - CDN enabled                            │ │
│  └───────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

---

## 1. Frontend Dockerfile (Next.js)

### 1.1. Multi-stage Build Dockerfile

```dockerfile
# ============================================
# Stage 1: Dependencies
# ============================================
FROM node:20-alpine AS deps
LABEL stage=deps

# 필수 시스템 패키지 설치
RUN apk add --no-cache libc6-compat

WORKDIR /app

# 의존성 파일만 먼저 복사 (캐싱 최적화)
COPY frontend/package*.json ./

# 프로덕션 의존성만 설치
RUN npm ci --only=production && \
    npm cache clean --force

# ============================================
# Stage 2: Builder
# ============================================
FROM node:20-alpine AS builder
LABEL stage=builder

WORKDIR /app

# 의존성 파일 복사
COPY frontend/package*.json ./

# 모든 의존성 설치 (devDependencies 포함)
RUN npm ci

# 소스 코드 복사
COPY frontend/ ./

# 환경변수 설정 (빌드 타임)
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

# Next.js 빌드 (Standalone 모드)
RUN npm run build

# ============================================
# Stage 3: Runner (최종 이미지)
# ============================================
FROM node:20-alpine AS runner
LABEL stage=runner
LABEL maintainer="your-email@example.com"

WORKDIR /app

# 보안: 비-root 사용자 생성
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Next.js 빌드 결과물 복사
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# 프로덕션 환경변수 설정
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# 비-root 사용자로 전환
USER nextjs

# 포트 노출
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# 애플리케이션 실행
CMD ["node", "server.js"]
```

### 1.2. next.config.js 수정 (Standalone 모드)

```javascript
// frontend/next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone 모드 활성화 (Docker 최적화)
  output: 'standalone',

  // 환경변수
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },

  // 이미지 최적화
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
        pathname: '/your-bucket-name/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },

  // 압축
  compress: true,

  // 프로덕션 소스맵 비활성화 (보안)
  productionBrowserSourceMaps: false,
}

module.exports = nextConfig
```

### 1.3. .dockerignore (Frontend)

```
# frontend/.dockerignore
node_modules
.next
out
.git
.gitignore
README.md
.env*
!.env.example
.DS_Store
npm-debug.log*
yarn-debug.log*
yarn-error.log*
coverage
.vscode
.idea
*.swp
*.swo
.husky
.github
```

### 1.4. Health Check API

```typescript
// frontend/app/api/health/route.ts
import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'frontend',
  })
}
```

---

## 2. Backend Dockerfile (NestJS)

### 2.1. Multi-stage Build Dockerfile

```dockerfile
# ============================================
# Stage 1: Dependencies
# ============================================
FROM node:20-alpine AS deps
LABEL stage=deps

# 필수 시스템 패키지 설치
RUN apk add --no-cache libc6-compat

WORKDIR /app

# 의존성 파일만 먼저 복사
COPY backend/package*.json ./

# 프로덕션 의존성만 설치
RUN npm ci --only=production && \
    npm cache clean --force

# ============================================
# Stage 2: Builder
# ============================================
FROM node:20-alpine AS builder
LABEL stage=builder

WORKDIR /app

# 의존성 파일 복사
COPY backend/package*.json ./

# 모든 의존성 설치
RUN npm ci

# 소스 코드 복사
COPY backend/ ./

# TypeScript 컴파일
RUN npm run build

# ============================================
# Stage 3: Runner (최종 이미지)
# ============================================
FROM node:20-alpine AS runner
LABEL stage=runner
LABEL maintainer="your-email@example.com"

WORKDIR /app

# 보안: 비-root 사용자 생성
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

# 프로덕션 의존성 복사
COPY --from=deps /app/node_modules ./node_modules

# 빌드 결과물 복사
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/package*.json ./

# 프로덕션 환경변수 설정
ENV NODE_ENV=production
ENV PORT=3002

# 비-root 사용자로 전환
USER nestjs

# 포트 노출
EXPOSE 3002

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3002/', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# 애플리케이션 실행
CMD ["node", "dist/main.js"]
```

### 2.2. .dockerignore (Backend)

```
# backend/.dockerignore
node_modules
dist
.git
.gitignore
README.md
.env*
!.env.example
.DS_Store
npm-debug.log*
yarn-debug.log*
yarn-error.log*
coverage
.vscode
.idea
*.swp
*.swo
uploads
pgdata
*.log
.husky
.github
test
e2e
```

---

## 3. Docker Compose (로컬 개발)

### 3.1. docker-compose.yml

```yaml
version: '3.9'

services:
  # PostgreSQL 데이터베이스
  postgres:
    image: postgres:15-alpine
    container_name: blog-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${DATABASE_NAME:-blog}
      POSTGRES_USER: ${DATABASE_USER:-postgres}
      POSTGRES_PASSWORD: ${DATABASE_PASSWORD:-postgres}
      PGDATA: /var/lib/postgresql/data/pgdata
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - blog-network

  # Backend (NestJS)
  backend:
    build:
      context: .
      dockerfile: backend/Dockerfile
      target: runner
    container_name: blog-backend
    restart: unless-stopped
    ports:
      - "3002:3002"
    environment:
      NODE_ENV: development
      PORT: 3002
      DATABASE_HOST: postgres
      DATABASE_PORT: 5432
      DATABASE_NAME: ${DATABASE_NAME:-blog}
      DATABASE_USER: ${DATABASE_USER:-postgres}
      DATABASE_PASSWORD: ${DATABASE_PASSWORD:-postgres}
      JWT_SECRET: ${JWT_SECRET:-your-secret-key}
      GOOGLE_CLOUD_PROJECT_ID: ${GOOGLE_CLOUD_PROJECT_ID}
      GOOGLE_CLOUD_STORAGE_BUCKET: ${GOOGLE_CLOUD_STORAGE_BUCKET}
    depends_on:
      postgres:
        condition: service_healthy
    volumes:
      # 로컬 개발 시 소스코드 마운트 (핫 리로드)
      - ./backend/src:/app/src:ro
      - ./backend/uploads:/app/uploads
    networks:
      - blog-network
    healthcheck:
      test: ["CMD", "wget", "-q", "--spider", "http://localhost:3002/"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Frontend (Next.js)
  frontend:
    build:
      context: .
      dockerfile: frontend/Dockerfile
      target: runner
      args:
        NEXT_PUBLIC_API_URL: http://localhost:3002
    container_name: blog-frontend
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: development
      NEXT_PUBLIC_API_URL: http://localhost:3002
    depends_on:
      - backend
    networks:
      - blog-network
    healthcheck:
      test: ["CMD", "wget", "-q", "--spider", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

networks:
  blog-network:
    driver: bridge

volumes:
  postgres_data:
    driver: local
```

### 3.2. docker-compose.prod.yml (프로덕션 오버라이드)

```yaml
version: '3.9'

services:
  backend:
    build:
      target: runner
    restart: always
    environment:
      NODE_ENV: production
      DATABASE_HOST: ${CLOUD_SQL_CONNECTION_NAME} # Cloud SQL Unix socket
    volumes:
      - /cloudsql:/cloudsql # Cloud SQL Proxy

  frontend:
    build:
      target: runner
      args:
        NEXT_PUBLIC_API_URL: ${PRODUCTION_API_URL}
    restart: always
    environment:
      NODE_ENV: production
```

---

## 4. 빌드 최적화

### 4.1. 이미지 크기 비교

**최적화 전**:
- Frontend: ~1.2GB
- Backend: ~800MB

**최적화 후 (Multi-stage build)**:
- Frontend: ~150MB
- Backend: ~120MB

**최적화 기법**:
1. ✅ Alpine Linux 사용 (가벼운 베이스 이미지)
2. ✅ Multi-stage build (빌드 도구 제거)
3. ✅ npm ci --only=production (dev 의존성 제거)
4. ✅ .dockerignore (불필요한 파일 제외)
5. ✅ 레이어 캐싱 최적화 (의존성 먼저 복사)

### 4.2. 빌드 속도 최적화

```bash
# Docker BuildKit 활성화 (병렬 빌드)
export DOCKER_BUILDKIT=1

# 빌드 캐시 활용
docker build --cache-from blog-frontend:latest -t blog-frontend:latest -f frontend/Dockerfile .

# 멀티 아키텍처 빌드 (ARM + x86)
docker buildx build --platform linux/amd64,linux/arm64 -t blog-frontend:latest .
```

---

## 5. 로컬 테스트

### 5.1. 빌드 및 실행

```bash
# 전체 스택 빌드 및 실행
docker-compose up --build

# 백그라운드 실행
docker-compose up -d

# 로그 확인
docker-compose logs -f

# 특정 서비스만 재시작
docker-compose restart backend

# 정지 및 삭제
docker-compose down

# 볼륨까지 삭제 (데이터 초기화)
docker-compose down -v
```

### 5.2. 개별 서비스 빌드

```bash
# Frontend 빌드
docker build -t blog-frontend:latest -f frontend/Dockerfile .

# Backend 빌드
docker build -t blog-backend:latest -f backend/Dockerfile .

# 태그 추가 (GCP Container Registry용)
docker tag blog-frontend:latest gcr.io/YOUR_PROJECT_ID/blog-frontend:latest
docker tag blog-backend:latest gcr.io/YOUR_PROJECT_ID/blog-backend:latest
```

### 5.3. 컨테이너 디버깅

```bash
# 컨테이너 내부 접속
docker exec -it blog-backend sh

# 로그 스트리밍
docker logs -f blog-backend

# 리소스 사용량 확인
docker stats

# 컨테이너 상세 정보
docker inspect blog-backend

# 네트워크 확인
docker network inspect blog-network
```

---

## 6. 보안 고려사항

### 6.1. 비-root 사용자 실행

```dockerfile
# Dockerfile에서 비-root 사용자 생성
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

USER nextjs
```

### 6.2. 환경변수 관리

```bash
# .env 파일 절대 커밋하지 않기!
# .env.example만 커밋

# Docker Secrets 사용 (Swarm mode)
docker secret create db_password /path/to/password.txt

# Cloud Run에서는 Secret Manager 사용
```

### 6.3. 이미지 스캔

```bash
# Docker Desktop 내장 스캔
docker scan blog-frontend:latest

# Trivy 사용
trivy image blog-frontend:latest

# Google Cloud Container Analysis
gcloud container images scan gcr.io/YOUR_PROJECT_ID/blog-frontend:latest
```

---

## 7. Health Check 및 Readiness Probe

### 7.1. Kubernetes/Cloud Run용 Health Check

```yaml
# Backend Health Check Endpoint
# backend/src/app.controller.ts
@Get()
healthCheck() {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  }
}

# Frontend Health Check
# frontend/app/api/health/route.ts
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  })
}
```

### 7.2. Dockerfile Health Check

```dockerfile
# Lightweight health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget -q --spider http://localhost:3002/ || exit 1
```

---

## 8. 환경별 설정

### 8.1. Development

```bash
# docker-compose.yml
docker-compose up
```

### 8.2. Staging

```bash
# docker-compose.staging.yml
docker-compose -f docker-compose.yml -f docker-compose.staging.yml up
```

### 8.3. Production

```bash
# docker-compose.prod.yml
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up
```

---

## 9. 리소스 제한

### 9.1. Docker Compose 리소스 제한

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
```

### 9.2. Cloud Run 리소스 설정

```yaml
# 나중에 CI/CD 문서에서 다룸
resources:
  limits:
    cpu: 1000m
    memory: 512Mi
```

---

## 10. 모니터링 및 로깅

### 10.1. 구조화된 로깅

```typescript
// Backend (NestJS)
import { Logger } from '@nestjs/common'

const logger = new Logger('AppName')

logger.log({
  level: 'info',
  message: 'Application started',
  timestamp: new Date().toISOString(),
  environment: process.env.NODE_ENV,
})
```

### 10.2. Docker 로그 드라이버

```yaml
services:
  backend:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

---

## 체크리스트

### 빌드 최적화
- [ ] Multi-stage build 사용
- [ ] Alpine Linux 베이스 이미지
- [ ] .dockerignore 작성
- [ ] 레이어 캐싱 최적화
- [ ] 프로덕션 의존성만 포함

### 보안
- [ ] 비-root 사용자 실행
- [ ] 환경변수 Secret 관리
- [ ] 이미지 스캔 실행
- [ ] 민감한 정보 제거

### 운영
- [ ] Health check 구현
- [ ] 구조화된 로깅
- [ ] 리소스 제한 설정
- [ ] 환경별 설정 분리

### 테스트
- [ ] 로컬 Docker Compose 테스트
- [ ] 개별 컨테이너 테스트
- [ ] Health check 동작 확인
- [ ] 리소스 사용량 모니터링

---

이제 GCP Cloud Run에 배포할 준비가 완료되었습니다! 🐳
