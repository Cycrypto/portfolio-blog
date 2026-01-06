# Docker & GCP 배포 빠른 시작 가이드

## 목차
1. [로컬 Docker 테스트](#1-로컬-docker-테스트)
2. [GCP 수동 배포](#2-gcp-수동-배포)
3. [트러블슈팅](#3-트러블슈팅)

---

## 1. 로컬 Docker 테스트

### 1.1. 개별 이미지 빌드 테스트

```bash
# Backend 빌드
cd backend
docker build -t blog-backend:test .

# Frontend 빌드
cd frontend
docker build --build-arg NEXT_PUBLIC_API_URL=http://localhost:3002 -t blog-frontend:test .

# 빌드된 이미지 확인
docker images | grep blog
```

### 1.2. Docker Compose로 전체 스택 테스트

```bash
# 루트 디렉토리에서 실행
docker-compose -f docker-compose.test.yml up --build

# 백그라운드 실행
docker-compose -f docker-compose.test.yml up -d

# 로그 확인
docker-compose -f docker-compose.test.yml logs -f

# 중지 및 삭제
docker-compose -f docker-compose.test.yml down
```

### 1.3. 테스트 확인

```bash
# Frontend Health Check
curl http://localhost:3000/api/health

# Backend Health Check
curl http://localhost:3002/

# 브라우저에서 확인
open http://localhost:3000
```

### 1.4. 빌드 자동화 스크립트

```bash
# 빌드 테스트 스크립트 실행
./scripts/docker-build-test.sh
```

---

## 2. GCP 수동 배포

### 2.1. 사전 준비

1. **GCP 프로젝트 생성**
   - https://console.cloud.google.com/
   - 새 프로젝트 생성 또는 기존 프로젝트 선택

2. **gcloud CLI 설치**
   ```bash
   # macOS
   brew install google-cloud-sdk

   # 또는 공식 설치 프로그램
   # https://cloud.google.com/sdk/docs/install
   ```

3. **GCP 인증**
   ```bash
   gcloud auth login
   gcloud config set project YOUR_PROJECT_ID
   ```

4. **Billing 활성화**
   - GCP Console → Billing
   - 프로젝트에 결제 계정 연결

### 2.2. 자동 배포 스크립트 사용

```bash
# 스크립트 실행
./scripts/gcp-manual-deploy.sh YOUR_PROJECT_ID asia-northeast3

# 예시
./scripts/gcp-manual-deploy.sh my-blog-project asia-northeast3
```

스크립트가 자동으로:
1. ✅ GCP 인증 확인
2. ✅ 필요한 API 활성화
3. ✅ Artifact Registry 생성
4. ✅ Docker 이미지 빌드 & 푸시
5. ✅ Cloud Run 배포

### 2.3. 수동 배포 (단계별)

#### Step 1: API 활성화
```bash
gcloud services enable \
    run.googleapis.com \
    cloudbuild.googleapis.com \
    artifactregistry.googleapis.com
```

#### Step 2: Artifact Registry 생성
```bash
gcloud artifacts repositories create blog-images \
    --repository-format=docker \
    --location=asia-northeast3 \
    --description="Blog Docker images"
```

#### Step 3: Docker 인증
```bash
gcloud auth configure-docker asia-northeast3-docker.pkg.dev
```

#### Step 4: Backend 빌드 & 푸시
```bash
cd backend

# 빌드
docker build -t asia-northeast3-docker.pkg.dev/YOUR_PROJECT_ID/blog-images/backend:latest .

# 푸시
docker push asia-northeast3-docker.pkg.dev/YOUR_PROJECT_ID/blog-images/backend:latest
```

#### Step 5: Backend 배포
```bash
gcloud run deploy blog-backend \
    --image asia-northeast3-docker.pkg.dev/YOUR_PROJECT_ID/blog-images/backend:latest \
    --platform managed \
    --region asia-northeast3 \
    --allow-unauthenticated \
    --min-instances 0 \
    --max-instances 5 \
    --cpu 1 \
    --memory 512Mi \
    --set-env-vars NODE_ENV=production
```

#### Step 6: Backend URL 확인
```bash
gcloud run services describe blog-backend \
    --region asia-northeast3 \
    --format='value(status.url)'
```

#### Step 7: Frontend 빌드 & 푸시
```bash
cd frontend

# Backend URL을 환경변수로 설정
BACKEND_URL=$(gcloud run services describe blog-backend --region asia-northeast3 --format='value(status.url)')

# 빌드
docker build \
    --build-arg NEXT_PUBLIC_API_URL=$BACKEND_URL \
    -t asia-northeast3-docker.pkg.dev/YOUR_PROJECT_ID/blog-images/frontend:latest .

# 푸시
docker push asia-northeast3-docker.pkg.dev/YOUR_PROJECT_ID/blog-images/frontend:latest
```

#### Step 8: Frontend 배포
```bash
gcloud run deploy blog-frontend \
    --image asia-northeast3-docker.pkg.dev/YOUR_PROJECT_ID/blog-images/frontend:latest \
    --platform managed \
    --region asia-northeast3 \
    --allow-unauthenticated \
    --min-instances 0 \
    --max-instances 10 \
    --cpu 1 \
    --memory 512Mi \
    --set-env-vars NODE_ENV=production,NEXT_PUBLIC_API_URL=$BACKEND_URL
```

### 2.4. 배포 확인

```bash
# Frontend URL 확인
gcloud run services describe blog-frontend \
    --region asia-northeast3 \
    --format='value(status.url)'

# Health Check
FRONTEND_URL=$(gcloud run services describe blog-frontend --region asia-northeast3 --format='value(status.url)')
curl $FRONTEND_URL/api/health

# 로그 확인
gcloud run logs read blog-frontend --region asia-northeast3 --limit 50
```

---

## 3. 트러블슈팅

### 3.1. Docker 빌드 실패

**문제**: `npm ci` 실패
```bash
# 해결: package-lock.json 재생성
rm package-lock.json
npm install
```

**문제**: 메모리 부족
```bash
# 해결: Docker Desktop 메모리 증가
# Settings → Resources → Memory → 4GB 이상
```

### 3.2. GCP 배포 실패

**문제**: 권한 부족
```bash
# 해결: 필요한 역할 부여
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
    --member=user:YOUR_EMAIL \
    --role=roles/run.admin
```

**문제**: API 미활성화
```bash
# 해결: 수동으로 API 활성화
gcloud services enable run.googleapis.com
```

### 3.3. Cloud Run 실행 오류

**문제**: 컨테이너 시작 실패
```bash
# 로그 확인
gcloud run logs read blog-backend --region asia-northeast3 --limit 100

# 가능한 원인:
# 1. 환경변수 누락
# 2. 포트 설정 오류 (PORT=3000 또는 3002)
# 3. Health check 실패
```

**문제**: 메모리 초과
```bash
# 해결: 메모리 증가
gcloud run services update blog-backend \
    --region asia-northeast3 \
    --memory 1Gi
```

### 3.4. 로컬 Docker 테스트

**문제**: Docker Compose 네트워크 오류
```bash
# 해결: 네트워크 재생성
docker-compose down
docker network prune
docker-compose up
```

**문제**: 포트 충돌
```bash
# 해결: 포트 변경 또는 기존 프로세스 종료
lsof -ti:3000 | xargs kill -9
lsof -ti:3002 | xargs kill -9
```

---

## 4. 유용한 명령어

### Docker

```bash
# 이미지 목록
docker images

# 컨테이너 목록
docker ps -a

# 로그 확인
docker logs -f CONTAINER_NAME

# 컨테이너 내부 접속
docker exec -it CONTAINER_NAME sh

# 이미지 삭제
docker rmi IMAGE_NAME

# 모든 컨테이너/이미지 삭제 (주의!)
docker system prune -a
```

### GCP Cloud Run

```bash
# 서비스 목록
gcloud run services list

# 서비스 상세 정보
gcloud run services describe SERVICE_NAME --region REGION

# 서비스 삭제
gcloud run services delete SERVICE_NAME --region REGION

# 로그 스트리밍
gcloud run logs tail SERVICE_NAME --region REGION

# 환경변수 업데이트
gcloud run services update SERVICE_NAME \
    --region REGION \
    --update-env-vars KEY=VALUE

# 트래픽 분할 (Blue-Green)
gcloud run services update-traffic SERVICE_NAME \
    --region REGION \
    --to-revisions=REVISION_NAME=50

# 리비전 목록
gcloud run revisions list --service SERVICE_NAME --region REGION
```

### 디버깅

```bash
# 빌드 로그 확인
docker build --progress=plain .

# 이미지 레이어 확인
docker history IMAGE_NAME

# 컨테이너 리소스 사용량
docker stats
```

---

## 5. 다음 단계

배포가 성공했다면:

1. **Custom Domain 연결**
   ```bash
   gcloud run domain-mappings create \
       --service blog-frontend \
       --domain yourblog.com \
       --region asia-northeast3
   ```

2. **Cloud SQL 연결** (데이터베이스)
   - docs/18_GCP_클라우드_서비스_이용_계획.md 참고

3. **CI/CD 구축**
   - docs/19_GCP_CICD_파이프라인_구축_계획.md 참고

4. **모니터링 설정**
   - GCP Console → Monitoring
   - Uptime checks, Alerting

---

## 참고 자료

- [Docker 공식 문서](https://docs.docker.com/)
- [GCP Cloud Run 문서](https://cloud.google.com/run/docs)
- [Next.js Docker 배포](https://nextjs.org/docs/deployment#docker-image)
- [NestJS Docker 배포](https://docs.nestjs.com/recipes/dockerfile)

---

문제가 발생하면 로그를 확인하고 위 트러블슈팅 섹션을 참고하세요! 🚀
