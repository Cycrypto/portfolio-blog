# GCP CI/CD 파이프라인 구축 계획

## 목표
GitHub → Cloud Build → Cloud Run 자동 배포 파이프라인 구축

---

## CI/CD 아키텍처

### 전체 흐름도

```
┌─────────────────────────────────────────────────────────────┐
│  Developer Workflow                                         │
│                                                             │
│  ┌──────────┐      ┌──────────┐      ┌──────────┐         │
│  │  Code    │ ───> │   Git    │ ───> │  GitHub  │         │
│  │  Change  │      │  Commit  │      │  Push    │         │
│  └──────────┘      └──────────┘      └──────────┘         │
│                                            │                │
│                                            ▼                │
│                                     ┌──────────────┐        │
│                                     │   GitHub     │        │
│                                     │  Webhook     │        │
│                                     └──────────────┘        │
└─────────────────────────────────────────────────────────────┘
                                            │
                                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Google Cloud Build (CI/CD)                                 │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  1. Trigger (GitHub Push/PR)                        │   │
│  └─────────────────────────────────────────────────────┘   │
│                            │                                │
│                            ▼                                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  2. Clone Repository                                │   │
│  └─────────────────────────────────────────────────────┘   │
│                            │                                │
│              ┌─────────────┴─────────────┐                  │
│              ▼                           ▼                  │
│  ┌────────────────────┐      ┌────────────────────┐        │
│  │  3a. Build         │      │  3b. Build         │        │
│  │  Frontend Image    │      │  Backend Image     │        │
│  └────────────────────┘      └────────────────────┘        │
│              │                           │                  │
│              ▼                           ▼                  │
│  ┌────────────────────┐      ┌────────────────────┐        │
│  │  4a. Run Tests     │      │  4b. Run Tests     │        │
│  │  (Frontend)        │      │  (Backend)         │        │
│  └────────────────────┘      └────────────────────┘        │
│              │                           │                  │
│              ▼                           ▼                  │
│  ┌────────────────────┐      ┌────────────────────┐        │
│  │  5a. Push to       │      │  5b. Push to       │        │
│  │  Artifact Registry │      │  Artifact Registry │        │
│  └────────────────────┘      └────────────────────┘        │
│              │                           │                  │
│              ▼                           ▼                  │
│  ┌────────────────────┐      ┌────────────────────┐        │
│  │  6a. Deploy to     │      │  6b. Run DB        │        │
│  │  Cloud Run         │      │  Migration         │        │
│  │  (Frontend)        │      └────────────────────┘        │
│  └────────────────────┘                 │                  │
│                                         ▼                  │
│                              ┌────────────────────┐        │
│                              │  6c. Deploy to     │        │
│                              │  Cloud Run         │        │
│                              │  (Backend)         │        │
│                              └────────────────────┘        │
│                                         │                  │
│                                         ▼                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  7. Slack/Email Notification                        │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 1. Cloud Build 설정

### 1.1. cloudbuild.yaml (메인 파이프라인)

```yaml
# cloudbuild.yaml
# 루트 디렉토리에 위치

# ============================================
# Substitutions (변수 정의)
# ============================================
substitutions:
  _REGION: asia-northeast3
  _FRONTEND_SERVICE: blog-frontend
  _BACKEND_SERVICE: blog-backend
  _FRONTEND_IMAGE: asia-northeast3-docker.pkg.dev/${PROJECT_ID}/blog-images/frontend
  _BACKEND_IMAGE: asia-northeast3-docker.pkg.dev/${PROJECT_ID}/blog-images/backend
  _CLOUDSQL_INSTANCE: ${PROJECT_ID}:asia-northeast3:blog-db

# ============================================
# Build Steps
# ============================================
steps:
  # ============================================
  # 1. Frontend Build
  # ============================================
  - name: 'gcr.io/cloud-builders/docker'
    id: 'build-frontend'
    args:
      - 'build'
      - '--file=frontend/Dockerfile'
      - '--tag=${_FRONTEND_IMAGE}:${SHORT_SHA}'
      - '--tag=${_FRONTEND_IMAGE}:latest'
      - '--build-arg=NEXT_PUBLIC_API_URL=https://api.yourblog.com'
      - '--cache-from=${_FRONTEND_IMAGE}:latest'
      - '.'
    waitFor: ['-']

  # ============================================
  # 2. Backend Build
  # ============================================
  - name: 'gcr.io/cloud-builders/docker'
    id: 'build-backend'
    args:
      - 'build'
      - '--file=backend/Dockerfile'
      - '--tag=${_BACKEND_IMAGE}:${SHORT_SHA}'
      - '--tag=${_BACKEND_IMAGE}:latest'
      - '--cache-from=${_BACKEND_IMAGE}:latest'
      - '.'
    waitFor: ['-']

  # ============================================
  # 3. Frontend Tests (선택사항)
  # ============================================
  - name: '${_FRONTEND_IMAGE}:${SHORT_SHA}'
    id: 'test-frontend'
    entrypoint: 'npm'
    args: ['run', 'test']
    dir: 'frontend'
    waitFor: ['build-frontend']
    # 테스트 실패 시 빌드 중단하지 않음 (선택)
    # allowExitCodes: [0, 1]

  # ============================================
  # 4. Backend Tests
  # ============================================
  - name: '${_BACKEND_IMAGE}:${SHORT_SHA}'
    id: 'test-backend'
    entrypoint: 'npm'
    args: ['run', 'test']
    dir: 'backend'
    waitFor: ['build-backend']

  # ============================================
  # 5. Push Frontend Image
  # ============================================
  - name: 'gcr.io/cloud-builders/docker'
    id: 'push-frontend'
    args:
      - 'push'
      - '--all-tags'
      - '${_FRONTEND_IMAGE}'
    waitFor: ['test-frontend']

  # ============================================
  # 6. Push Backend Image
  # ============================================
  - name: 'gcr.io/cloud-builders/docker'
    id: 'push-backend'
    args:
      - 'push'
      - '--all-tags'
      - '${_BACKEND_IMAGE}'
    waitFor: ['test-backend']

  # ============================================
  # 7. Database Migration (Backend만 해당)
  # ============================================
  - name: 'gcr.io/google-appengine/exec-wrapper'
    id: 'run-migrations'
    args:
      - '-i'
      - '${_BACKEND_IMAGE}:${SHORT_SHA}'
      - '-s'
      - '${_CLOUDSQL_INSTANCE}'
      - '--'
      - 'npm'
      - 'run'
      - 'migration:run'
    env:
      - 'DATABASE_HOST=/cloudsql/${_CLOUDSQL_INSTANCE}'
      - 'DATABASE_NAME=${_DATABASE_NAME}'
      - 'DATABASE_USER=${_DATABASE_USER}'
    secretEnv:
      - 'DATABASE_PASSWORD'
    waitFor: ['push-backend']

  # ============================================
  # 8. Deploy Frontend to Cloud Run
  # ============================================
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    id: 'deploy-frontend'
    entrypoint: gcloud
    args:
      - 'run'
      - 'deploy'
      - '${_FRONTEND_SERVICE}'
      - '--image=${_FRONTEND_IMAGE}:${SHORT_SHA}'
      - '--region=${_REGION}'
      - '--platform=managed'
      - '--allow-unauthenticated'
      - '--min-instances=0'
      - '--max-instances=10'
      - '--cpu=1'
      - '--memory=512Mi'
      - '--timeout=300'
      - '--set-env-vars=NODE_ENV=production,NEXT_PUBLIC_API_URL=https://api.yourblog.com'
    waitFor: ['push-frontend']

  # ============================================
  # 9. Deploy Backend to Cloud Run
  # ============================================
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    id: 'deploy-backend'
    entrypoint: gcloud
    args:
      - 'run'
      - 'deploy'
      - '${_BACKEND_SERVICE}'
      - '--image=${_BACKEND_IMAGE}:${SHORT_SHA}'
      - '--region=${_REGION}'
      - '--platform=managed'
      - '--allow-unauthenticated'
      - '--min-instances=0'
      - '--max-instances=5'
      - '--cpu=1'
      - '--memory=512Mi'
      - '--timeout=300'
      - '--add-cloudsql-instances=${_CLOUDSQL_INSTANCE}'
      - '--set-env-vars=NODE_ENV=production,DATABASE_HOST=/cloudsql/${_CLOUDSQL_INSTANCE}'
      - '--update-secrets=DATABASE_PASSWORD=database-password:latest,JWT_SECRET=jwt-secret:latest'
    waitFor: ['run-migrations']

  # ============================================
  # 10. Health Check
  # ============================================
  - name: 'gcr.io/cloud-builders/curl'
    id: 'health-check'
    args:
      - '-f'
      - 'https://api.yourblog.com/'
    waitFor: ['deploy-backend']

# ============================================
# Secret Manager Integration
# ============================================
availableSecrets:
  secretManager:
    - versionName: projects/${PROJECT_ID}/secrets/database-password/versions/latest
      env: DATABASE_PASSWORD

# ============================================
# Build Options
# ============================================
options:
  # 빌드 머신 타입 (무료: E2_HIGHCPU_8, 유료: N1_HIGHCPU_32)
  machineType: 'E2_HIGHCPU_8'

  # 빌드 로그 저장
  logging: CLOUD_LOGGING_ONLY

  # 빌드 타임아웃
  timeout: 1800s # 30분

  # Docker 레이어 캐싱
  dynamic_substitutions: true

# ============================================
# Images (Artifact Registry에 푸시)
# ============================================
images:
  - '${_FRONTEND_IMAGE}:${SHORT_SHA}'
  - '${_FRONTEND_IMAGE}:latest'
  - '${_BACKEND_IMAGE}:${SHORT_SHA}'
  - '${_BACKEND_IMAGE}:latest'

# ============================================
# Timeout
# ============================================
timeout: 1800s # 30분
```

### 1.2. Branch별 빌드 설정

```yaml
# cloudbuild.dev.yaml (개발 브랜치)
substitutions:
  _REGION: asia-northeast3
  _FRONTEND_SERVICE: blog-frontend-dev
  _BACKEND_SERVICE: blog-backend-dev
  _FRONTEND_IMAGE: asia-northeast3-docker.pkg.dev/${PROJECT_ID}/blog-images/frontend-dev
  _BACKEND_IMAGE: asia-northeast3-docker.pkg.dev/${PROJECT_ID}/blog-images/backend-dev

# 나머지 steps는 동일...
```

---

## 2. Cloud Build Trigger 설정

### 2.1. GitHub 연동

```bash
# Cloud Build GitHub 앱 설치
# https://github.com/apps/google-cloud-build

# 저장소 연결 확인
gcloud builds triggers list
```

### 2.2. Trigger 생성 (gcloud CLI)

```bash
# ============================================
# Production Trigger (main 브랜치)
# ============================================
gcloud builds triggers create github \
  --name="blog-production-deploy" \
  --repo-name="my-blog" \
  --repo-owner="YOUR_GITHUB_USERNAME" \
  --branch-pattern="^main$" \
  --build-config="cloudbuild.yaml" \
  --description="Deploy to production on main branch push" \
  --substitutions="_REGION=asia-northeast3"

# ============================================
# Development Trigger (develop 브랜치)
# ============================================
gcloud builds triggers create github \
  --name="blog-dev-deploy" \
  --repo-name="my-blog" \
  --repo-owner="YOUR_GITHUB_USERNAME" \
  --branch-pattern="^develop$" \
  --build-config="cloudbuild.dev.yaml" \
  --description="Deploy to dev environment" \
  --substitutions="_REGION=asia-northeast3"

# ============================================
# PR Trigger (Pull Request 검증)
# ============================================
gcloud builds triggers create github \
  --name="blog-pr-validation" \
  --repo-name="my-blog" \
  --repo-owner="YOUR_GITHUB_USERNAME" \
  --pull-request-pattern="^main$" \
  --build-config="cloudbuild.pr.yaml" \
  --description="Validate Pull Requests" \
  --comment-control=COMMENTS_ENABLED
```

### 2.3. PR Validation 전용 빌드

```yaml
# cloudbuild.pr.yaml (PR 검증만, 배포 안함)
steps:
  # 1. Frontend Build & Test
  - name: 'gcr.io/cloud-builders/docker'
    args:
      - 'build'
      - '--file=frontend/Dockerfile'
      - '--target=builder'
      - '.'

  # 2. Backend Build & Test
  - name: 'gcr.io/cloud-builders/docker'
    args:
      - 'build'
      - '--file=backend/Dockerfile'
      - '--target=builder'
      - '.'

  # 3. Lint Check
  - name: 'node:20-alpine'
    entrypoint: 'npm'
    args: ['run', 'lint']
    dir: 'frontend'

  # 4. Type Check
  - name: 'node:20-alpine'
    entrypoint: 'npm'
    args: ['run', 'type-check']
    dir: 'backend'

options:
  machineType: 'E2_HIGHCPU_8'
  logging: CLOUD_LOGGING_ONLY
```

---

## 3. 자동 롤백 전략

### 3.1. Cloud Run Revision 관리

```yaml
# cloudbuild.yaml에 추가
steps:
  # ... 기존 배포 단계 ...

  # ============================================
  # Traffic Split (Blue-Green Deployment)
  # ============================================
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    id: 'gradual-rollout'
    entrypoint: gcloud
    args:
      - 'run'
      - 'services'
      - 'update-traffic'
      - '${_BACKEND_SERVICE}'
      - '--region=${_REGION}'
      - '--to-revisions=LATEST=10' # 새 버전에 10% 트래픽
    waitFor: ['deploy-backend']

  # ============================================
  # Health Check (5분 후)
  # ============================================
  - name: 'gcr.io/cloud-builders/gcloud'
    id: 'wait-and-check'
    entrypoint: 'bash'
    args:
      - '-c'
      - |
        sleep 300
        curl -f https://api.yourblog.com/ || exit 1
    waitFor: ['gradual-rollout']

  # ============================================
  # Full Rollout (Health Check 성공 시)
  # ============================================
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    id: 'full-rollout'
    entrypoint: gcloud
    args:
      - 'run'
      - 'services'
      - 'update-traffic'
      - '${_BACKEND_SERVICE}'
      - '--region=${_REGION}'
      - '--to-latest' # 100% 트래픽
    waitFor: ['wait-and-check']
```

### 3.2. 수동 롤백 스크립트

```bash
#!/bin/bash
# scripts/rollback.sh

SERVICE_NAME="blog-backend"
REGION="asia-northeast3"

# 이전 Revision 확인
gcloud run revisions list \
  --service=$SERVICE_NAME \
  --region=$REGION \
  --format="table(name,status)"

# 특정 Revision으로 롤백
read -p "Rollback to revision: " REVISION_NAME

gcloud run services update-traffic $SERVICE_NAME \
  --region=$REGION \
  --to-revisions=$REVISION_NAME=100
```

---

## 4. 환경별 배포 전략

### 4.1. 브랜치 전략

```
main (Production)
  │
  ├── develop (Development)
  │     │
  │     ├── feature/add-comments
  │     ├── feature/image-upload
  │     └── bugfix/login-error
  │
  └── hotfix/critical-bug
```

### 4.2. 배포 흐름

```
Feature Branch → PR → develop → Auto Deploy (Dev)
                                    │
                            Manual Review
                                    │
                      develop → main → Auto Deploy (Prod)
```

### 4.3. 환경별 Service 분리

```bash
# Development
- blog-frontend-dev (Cloud Run)
- blog-backend-dev (Cloud Run)
- blog-db-dev (Cloud SQL)

# Production
- blog-frontend (Cloud Run)
- blog-backend (Cloud Run)
- blog-db (Cloud SQL)
```

---

## 5. 알림 설정

### 5.1. Slack 알림

```yaml
# cloudbuild.yaml에 추가
steps:
  # ... 기존 steps ...

  # ============================================
  # Slack Notification (성공)
  # ============================================
  - name: 'gcr.io/cloud-builders/curl'
    id: 'notify-slack-success'
    entrypoint: 'bash'
    args:
      - '-c'
      - |
        curl -X POST ${_SLACK_WEBHOOK_URL} \
          -H 'Content-Type: application/json' \
          -d '{
            "text": "✅ Blog Deployment Successful",
            "blocks": [
              {
                "type": "section",
                "text": {
                  "type": "mrkdwn",
                  "text": "*Deployment Status*: Success\n*Branch*: ${BRANCH_NAME}\n*Commit*: ${SHORT_SHA}\n*Build ID*: ${BUILD_ID}"
                }
              }
            ]
          }'
    waitFor: ['deploy-backend', 'deploy-frontend']
```

### 5.2. 이메일 알림

```bash
# Pub/Sub Topic 생성
gcloud pubsub topics create cloud-builds

# Cloud Build에서 Pub/Sub로 이벤트 발행
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member=serviceAccount:YOUR_PROJECT_NUMBER@cloudbuild.gserviceaccount.com \
  --role=roles/pubsub.publisher

# Cloud Function으로 이메일 발송 (선택사항)
```

---

## 6. 성능 최적화

### 6.1. Docker Layer 캐싱

```yaml
# cloudbuild.yaml
steps:
  - name: 'gcr.io/cloud-builders/docker'
    args:
      - 'build'
      - '--file=frontend/Dockerfile'
      - '--tag=${_FRONTEND_IMAGE}:${SHORT_SHA}'
      - '--cache-from=${_FRONTEND_IMAGE}:latest' # 이전 빌드 캐시 사용
      - '.'
```

### 6.2. 병렬 빌드

```yaml
# Frontend와 Backend 동시 빌드
steps:
  - name: 'gcr.io/cloud-builders/docker'
    id: 'build-frontend'
    args: [...]
    waitFor: ['-'] # 의존성 없음

  - name: 'gcr.io/cloud-builders/docker'
    id: 'build-backend'
    args: [...]
    waitFor: ['-'] # 의존성 없음
```

### 6.3. Kaniko 사용 (더 빠른 빌드)

```yaml
# Kaniko: Docker daemon 없이 빌드 (더 빠름)
steps:
  - name: 'gcr.io/kaniko-project/executor:latest'
    args:
      - '--dockerfile=frontend/Dockerfile'
      - '--destination=${_FRONTEND_IMAGE}:${SHORT_SHA}'
      - '--cache=true'
      - '--cache-ttl=24h'
```

---

## 7. 비용 최적화

### 7.1. Cloud Build 무료 티어
- **빌드 시간**: 120분/일 (무료)
- **초과 비용**: $0.003/빌드-분

**예상 사용량**:
- 하루 10회 배포
- 각 빌드 5분
- 총 50분/일 → **무료**

### 7.2. 빌드 최적화 팁

```yaml
# 불필요한 단계 건너뛰기
steps:
  - name: 'gcr.io/cloud-builders/docker'
    id: 'build-frontend'
    # main 브랜치만 배포
    env:
      - 'BRANCH_NAME=${BRANCH_NAME}'
    entrypoint: 'bash'
    args:
      - '-c'
      - |
        if [ "$BRANCH_NAME" != "main" ]; then
          echo "Skipping deployment for non-main branch"
          exit 0
        fi
        docker build ...
```

---

## 8. 보안

### 8.1. Secret Manager 사용

```bash
# Secret 생성
echo -n "my-database-password" | gcloud secrets create database-password --data-file=-

# Cloud Build에 권한 부여
gcloud secrets add-iam-policy-binding database-password \
  --member=serviceAccount:YOUR_PROJECT_NUMBER@cloudbuild.gserviceaccount.com \
  --role=roles/secretmanager.secretAccessor
```

### 8.2. 이미지 취약점 스캔

```yaml
# cloudbuild.yaml
steps:
  # ... 빌드 단계 ...

  # ============================================
  # Security Scan
  # ============================================
  - name: 'gcr.io/cloud-builders/gcloud'
    id: 'scan-image'
    args:
      - 'container'
      - 'images'
      - 'scan'
      - '${_BACKEND_IMAGE}:${SHORT_SHA}'
    waitFor: ['push-backend']
```

---

## 9. 모니터링 및 로깅

### 9.1. 빌드 로그 확인

```bash
# 최근 빌드 목록
gcloud builds list --limit=10

# 특정 빌드 로그
gcloud builds log BUILD_ID

# 실시간 로그 스트리밍
gcloud builds log BUILD_ID --stream
```

### 9.2. 빌드 히스토리 대시보드

```bash
# GCP Console → Cloud Build → History
# https://console.cloud.google.com/cloud-build/builds
```

---

## 10. 전체 배포 프로세스

### 10.1. 개발자 워크플로우

```bash
# 1. Feature 브랜치 생성
git checkout -b feature/add-comments

# 2. 코드 작성 및 커밋
git add .
git commit -m "feat: 댓글 기능 추가"

# 3. GitHub에 푸시
git push origin feature/add-comments

# 4. Pull Request 생성
# → Cloud Build가 자동으로 PR 검증

# 5. PR Merge (develop)
# → Cloud Build가 자동으로 Dev 환경에 배포

# 6. QA/테스트 완료 후 main으로 Merge
# → Cloud Build가 자동으로 Production 배포
```

### 10.2. 배포 타임라인

```
0:00 - Git Push
0:01 - Cloud Build Trigger
0:02 - Docker Build Start
0:05 - Frontend Build Complete
0:07 - Backend Build Complete
0:08 - Tests Running
0:10 - Tests Pass
0:11 - Push to Artifact Registry
0:12 - Database Migration
0:13 - Deploy to Cloud Run
0:15 - Health Check
0:16 - Deployment Complete ✅
```

**총 배포 시간**: ~15분

---

## 체크리스트

### 초기 설정
- [ ] Cloud Build API 활성화
- [ ] GitHub 저장소 연결
- [ ] Artifact Registry 생성
- [ ] Secret Manager 설정

### Trigger 생성
- [ ] Production Trigger (main 브랜치)
- [ ] Development Trigger (develop 브랜치)
- [ ] PR Validation Trigger

### Build 파일 작성
- [ ] cloudbuild.yaml (Production)
- [ ] cloudbuild.dev.yaml (Development)
- [ ] cloudbuild.pr.yaml (PR Validation)

### 배포 테스트
- [ ] Feature 브랜치 → PR → develop
- [ ] develop → Production
- [ ] 롤백 테스트

### 알림 설정
- [ ] Slack Webhook 연동
- [ ] 빌드 실패 알림
- [ ] 배포 성공 알림

### 모니터링
- [ ] 빌드 로그 확인
- [ ] 배포 히스토리 확인
- [ ] 비용 모니터링

---

## 예상 비용 (월)

| 항목 | 사용량 | 비용 |
|------|--------|------|
| **Cloud Build** | 50분/일 × 30일 = 1,500분 | $0 (무료 3,600분) |
| **Artifact Registry** | 이미지 2개 × 200MB | $0 (무료 0.5GB) |
| **네트워크 Egress** | 빌드 결과물 전송 | 포함됨 |
| **총 비용** | | **$0/월** |

---

이제 완전 자동화된 CI/CD 파이프라인이 구축되었습니다! 🚀

**다음 단계**:
1. `cloudbuild.yaml` 파일 작성
2. GitHub 저장소 연결
3. Trigger 생성
4. 테스트 배포
5. Production 배포

코드를 푸시하면 자동으로 배포됩니다! 🎉
