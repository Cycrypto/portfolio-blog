# ============================================
# Stage 1: Dependencies
# ============================================
FROM node:20-alpine AS deps
LABEL stage=deps

# 필수 시스템 패키지 설치
RUN apk add --no-cache libc6-compat

WORKDIR /app

# 의존성 파일만 먼저 복사 (캐싱 최적화)
COPY package*.json ./

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
COPY package*.json ./

# 모든 의존성 설치 (devDependencies 포함)
RUN npm ci

# 소스 코드 복사
COPY . .

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
LABEL maintainer="blog@example.com"

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
