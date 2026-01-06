# GCP 클라우드 서비스 이용 계획

## 목표
Google Cloud Platform의 무료 티어와 저비용 서비스를 활용한 블로그 운영

---

## GCP 서비스 아키텍처

### 전체 구성도

```
┌─────────────────────────────────────────────────────────────┐
│  Google Cloud Platform                                      │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  Cloud CDN                                            │ │
│  │  - Global edge caching                                │ │
│  │  - SSL/TLS termination                                │ │
│  └───────────────────────────────────────────────────────┘ │
│                            │                                │
│                            ▼                                │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  Cloud Load Balancing                                 │ │
│  │  - HTTPS Load Balancer                                │ │
│  │  - Custom domain: yourblog.com                        │ │
│  └───────────────────────────────────────────────────────┘ │
│                            │                                │
│              ┌─────────────┴─────────────┐                  │
│              ▼                           ▼                  │
│  ┌─────────────────────┐   ┌──────────────────────────┐    │
│  │ Cloud Run           │   │ Cloud Run                │    │
│  │ (Frontend)          │   │ (Backend)                │    │
│  │ - Next.js           │   │ - NestJS                 │    │
│  │ - Auto-scaling      │   │ - Auto-scaling           │    │
│  │ - Min: 0            │   │ - Min: 0                 │    │
│  │ - Max: 10           │   │ - Max: 5                 │    │
│  └─────────────────────┘   └──────────────────────────┘    │
│                                          │                  │
│                                          ▼                  │
│                          ┌──────────────────────────┐       │
│                          │ Cloud SQL                │       │
│                          │ - PostgreSQL 15          │       │
│                          │ - db-f1-micro (무료)     │       │
│                          │ - 10GB storage           │       │
│                          │ - Private IP             │       │
│                          └──────────────────────────┘       │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  Cloud Storage                                        │ │
│  │  - Blog images bucket (Public)                        │ │
│  │  - CDN enabled                                        │ │
│  │  - Lifecycle policy (90일 후 Archive)                 │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  Secret Manager                                       │ │
│  │  - Database credentials                               │ │
│  │  - JWT secrets                                        │ │
│  │  - API keys                                           │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  Container Registry / Artifact Registry               │ │
│  │  - Docker images                                      │ │
│  │  - Version management                                 │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  Cloud Logging & Monitoring                           │ │
│  │  - Application logs                                   │ │
│  │  - Metrics & Alerts                                   │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## 1. Cloud Run (컴퓨팅)

### 1.1. 서비스 개요
- **Serverless 컨테이너 플랫폼**
- 사용한 만큼만 비용 지불
- 자동 스케일링 (0 → N)
- HTTPS 자동 제공

### 1.2. 무료 티어
- **CPU 시간**: 180,000 vCPU-초/월 (50시간)
- **메모리**: 360,000 GiB-초/월
- **요청**: 2,000,000 요청/월
- **네트워크 Egress**: 1GB/월 (북미)

### 1.3. Frontend 설정 (Next.js)

```yaml
# Frontend Cloud Run 설정
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: blog-frontend
  labels:
    cloud.googleapis.com/location: asia-northeast3
spec:
  template:
    metadata:
      annotations:
        # Auto-scaling 설정
        autoscaling.knative.dev/minScale: "0"
        autoscaling.knative.dev/maxScale: "10"
        # 리소스 할당
        run.googleapis.com/cpu-throttling: "true"
    spec:
      containerConcurrency: 80
      timeoutSeconds: 300
      containers:
      - image: gcr.io/YOUR_PROJECT_ID/blog-frontend:latest
        ports:
        - name: http1
          containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: NEXT_PUBLIC_API_URL
          value: "https://api.yourblog.com"
        resources:
          limits:
            cpu: "1000m"
            memory: "512Mi"
```

**비용 예상 (월 5,000 방문자)**:
- CPU: ~30,000 vCPU-초 = **무료**
- 메모리: ~60,000 GiB-초 = **무료**
- 요청: ~15,000 요청 = **무료**
- **총 비용: $0**

### 1.4. Backend 설정 (NestJS)

```yaml
# Backend Cloud Run 설정
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: blog-backend
  labels:
    cloud.googleapis.com/location: asia-northeast3
spec:
  template:
    metadata:
      annotations:
        autoscaling.knative.dev/minScale: "0"
        autoscaling.knative.dev/maxScale: "5"
        # Cloud SQL 연결
        run.googleapis.com/cloudsql-instances: "YOUR_PROJECT_ID:asia-northeast3:blog-db"
    spec:
      containerConcurrency: 80
      timeoutSeconds: 300
      containers:
      - image: gcr.io/YOUR_PROJECT_ID/blog-backend:latest
        ports:
        - name: http1
          containerPort: 3002
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_HOST
          value: "/cloudsql/YOUR_PROJECT_ID:asia-northeast3:blog-db"
        - name: DATABASE_NAME
          valueFrom:
            secretKeyRef:
              name: database-name
              key: latest
        - name: DATABASE_USER
          valueFrom:
            secretKeyRef:
              name: database-user
              key: latest
        - name: DATABASE_PASSWORD
          valueFrom:
            secretKeyRef:
              name: database-password
              key: latest
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: jwt-secret
              key: latest
        resources:
          limits:
            cpu: "1000m"
            memory: "512Mi"
```

**비용 예상 (월 5,000 방문자)**:
- CPU: ~20,000 vCPU-초 = **무료**
- 메모리: ~40,000 GiB-초 = **무료**
- 요청: ~10,000 요청 = **무료**
- **총 비용: $0**

### 1.5. Cloud Run 명령어

```bash
# Frontend 배포
gcloud run deploy blog-frontend \
  --image gcr.io/YOUR_PROJECT_ID/blog-frontend:latest \
  --platform managed \
  --region asia-northeast3 \
  --allow-unauthenticated \
  --min-instances 0 \
  --max-instances 10 \
  --cpu 1 \
  --memory 512Mi \
  --timeout 300 \
  --set-env-vars NODE_ENV=production,NEXT_PUBLIC_API_URL=https://api.yourblog.com

# Backend 배포 (Cloud SQL 연결)
gcloud run deploy blog-backend \
  --image gcr.io/YOUR_PROJECT_ID/blog-backend:latest \
  --platform managed \
  --region asia-northeast3 \
  --allow-unauthenticated \
  --min-instances 0 \
  --max-instances 5 \
  --cpu 1 \
  --memory 512Mi \
  --timeout 300 \
  --add-cloudsql-instances YOUR_PROJECT_ID:asia-northeast3:blog-db \
  --set-secrets DATABASE_PASSWORD=database-password:latest,JWT_SECRET=jwt-secret:latest

# 서비스 확인
gcloud run services list

# 로그 확인
gcloud run logs read blog-backend --limit 50
```

---

## 2. Cloud SQL (데이터베이스)

### 2.1. 서비스 개요
- **관리형 PostgreSQL**
- 자동 백업, 패치
- HA (High Availability) 지원

### 2.2. 무료 티어 (90일간)
- **인스턴스 타입**: db-f1-micro (0.6GB RAM, 공유 CPU)
- **스토리지**: 10GB HDD
- **백업**: 7일 보관
- **리전**: asia-northeast3 (서울) 또는 us-central1 (아이오와)

**주의**: 무료 티어는 90일 후 종료되지만, db-f1-micro는 계속 저렴함

### 2.3. 비용 예상 (유료 전환 후)

**db-f1-micro (서울 리전)**:
- 인스턴스: ~$7.67/월
- 스토리지 (10GB HDD): ~$1.70/월
- 백업 (10GB): ~$0.80/월
- **총 비용: ~$10/월**

**db-g1-small (더 안정적, 1.7GB RAM)**:
- 인스턴스: ~$25.55/월
- 스토리지 (10GB SSD): ~$1.70/월
- **총 비용: ~$27/월**

### 2.4. Cloud SQL 생성

```bash
# PostgreSQL 인스턴스 생성 (무료 티어)
gcloud sql instances create blog-db \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=asia-northeast3 \
  --storage-type=HDD \
  --storage-size=10GB \
  --storage-auto-increase \
  --backup \
  --backup-start-time=03:00 \
  --maintenance-window-day=SUN \
  --maintenance-window-hour=04 \
  --database-flags=max_connections=100

# 데이터베이스 생성
gcloud sql databases create blog \
  --instance=blog-db

# 사용자 생성
gcloud sql users create bloguser \
  --instance=blog-db \
  --password=YOUR_SECURE_PASSWORD

# Private IP 설정 (Cloud Run 연결용)
gcloud sql instances patch blog-db \
  --network=projects/YOUR_PROJECT_ID/global/networks/default \
  --no-assign-ip
```

### 2.5. 백업 및 복구

```bash
# 수동 백업 생성
gcloud sql backups create \
  --instance=blog-db \
  --description="Manual backup before migration"

# 백업 목록 확인
gcloud sql backups list --instance=blog-db

# 복구
gcloud sql backups restore BACKUP_ID \
  --backup-instance=blog-db \
  --backup-id=BACKUP_RUN_ID
```

### 2.6. 비용 최적화 팁

```bash
# 개발 환경: 야간/주말 인스턴스 중지
gcloud sql instances patch blog-db --activation-policy=NEVER

# 프로덕션 재시작
gcloud sql instances patch blog-db --activation-policy=ALWAYS

# 스토리지 자동 증가 비활성화 (비용 제한)
gcloud sql instances patch blog-db --no-storage-auto-increase
```

---

## 3. Cloud Storage (이미지 저장소)

### 3.1. 서비스 개요
- **오브젝트 스토리지**
- 정적 파일 호스팅
- CDN 연동

### 3.2. 무료 티어
- **Standard Storage**: 5GB/월
- **Class A 작업**: 5,000/월 (쓰기)
- **Class B 작업**: 50,000/월 (읽기)
- **Egress**: 1GB/월 (북미), 200MB/월 (아시아)

### 3.3. 비용 (유료)
- **Standard Storage (아시아)**: $0.020/GB/월
- **Nearline (90일 이상)**: $0.010/GB/월
- **Class A 작업**: $0.005/1,000
- **Egress (아시아)**: $0.12/GB

**예상 비용 (10GB 이미지, 월 100GB 트래픽)**:
- Storage: $0.20
- Class A: $0.01
- Egress: $12.00
- **총 비용: ~$12/월**

**최적화**: Cloud CDN 사용 시 Egress 비용 절감

### 3.4. 버킷 생성

```bash
# Public 버킷 생성 (블로그 이미지용)
gcloud storage buckets create gs://YOUR_BUCKET_NAME \
  --location=asia-northeast3 \
  --storage-class=STANDARD \
  --uniform-bucket-level-access

# Public 액세스 허용
gcloud storage buckets add-iam-policy-binding gs://YOUR_BUCKET_NAME \
  --member=allUsers \
  --role=roles/storage.objectViewer

# CORS 설정 (프론트엔드 접근 허용)
cat > cors.json <<EOF
[
  {
    "origin": ["https://yourblog.com"],
    "method": ["GET", "HEAD"],
    "responseHeader": ["Content-Type"],
    "maxAgeSeconds": 3600
  }
]
EOF

gcloud storage buckets update gs://YOUR_BUCKET_NAME --cors-file=cors.json

# Lifecycle 정책 (90일 후 Nearline으로 이동)
cat > lifecycle.json <<EOF
{
  "lifecycle": {
    "rule": [
      {
        "action": {"type": "SetStorageClass", "storageClass": "NEARLINE"},
        "condition": {"age": 90}
      }
    ]
  }
}
EOF

gcloud storage buckets update gs://YOUR_BUCKET_NAME --lifecycle-file=lifecycle.json
```

### 3.5. CDN 연동 (비용 최적화)

```bash
# Backend bucket 생성 (Cloud CDN용)
gcloud compute backend-buckets create blog-images-backend \
  --gcs-bucket-name=YOUR_BUCKET_NAME \
  --enable-cdn

# URL Map 생성
gcloud compute url-maps create blog-cdn \
  --default-backend-bucket=blog-images-backend

# CDN을 통한 이미지 제공 (Egress 비용 절감)
# https://cdn.yourblog.com/image.jpg
```

**CDN 사용 시 비용**:
- **Cache Hit**: $0.04/GB (Egress $0.12/GB 대비 70% 절감!)
- **Cache Fill**: $0.08/GB (첫 요청만)

---

## 4. Secret Manager (환경변수 관리)

### 4.1. 서비스 개요
- **암호화된 환경변수 저장**
- 버전 관리
- IAM 기반 접근 제어

### 4.2. 무료 티어
- **6개 활성 Secret 버전**: 무료
- **10,000 액세스 작업/월**: 무료

### 4.3. 비용 (초과 시)
- **활성 버전**: $0.06/버전/월
- **액세스 작업**: $0.03/10,000

**예상 비용**: **$0** (무료 티어 내 충분)

### 4.4. Secret 생성

```bash
# 데이터베이스 비밀번호
echo -n "YOUR_DB_PASSWORD" | gcloud secrets create database-password \
  --data-file=-

# JWT Secret
echo -n "YOUR_JWT_SECRET" | gcloud secrets create jwt-secret \
  --data-file=-

# 데이터베이스 사용자
echo -n "bloguser" | gcloud secrets create database-user \
  --data-file=-

# Secret 목록 확인
gcloud secrets list

# Cloud Run에 Secret 접근 권한 부여
gcloud secrets add-iam-policy-binding database-password \
  --member=serviceAccount:YOUR_PROJECT_NUMBER-compute@developer.gserviceaccount.com \
  --role=roles/secretmanager.secretAccessor
```

---

## 5. Container Registry / Artifact Registry

### 5.1. Container Registry (구버전)
- **무료 Storage**: 없음 (Cloud Storage 비용)
- **Egress**: Cloud Storage 비용

### 5.2. Artifact Registry (신버전, 권장)
- **무료 Storage**: 0.5GB/월
- **Egress**: Cloud Storage 비용

**비용 (초과 시)**:
- **Storage**: $0.10/GB/월

**예상 비용** (이미지 2개, 각 200MB):
- Storage (0.4GB): **무료**

### 5.3. Artifact Registry 설정

```bash
# Artifact Registry 활성화
gcloud services enable artifactregistry.googleapis.com

# Docker 저장소 생성
gcloud artifacts repositories create blog-images \
  --repository-format=docker \
  --location=asia-northeast3 \
  --description="Blog Docker images"

# Docker 인증 설정
gcloud auth configure-docker asia-northeast3-docker.pkg.dev

# 이미지 푸시
docker tag blog-frontend:latest asia-northeast3-docker.pkg.dev/YOUR_PROJECT_ID/blog-images/frontend:latest
docker push asia-northeast3-docker.pkg.dev/YOUR_PROJECT_ID/blog-images/frontend:latest
```

---

## 6. Cloud CDN (콘텐츠 전송)

### 6.1. 서비스 개요
- **글로벌 엣지 캐싱**
- Egress 비용 절감
- HTTPS 자동

### 6.2. 비용
- **Cache Hit**: $0.04/GB (아시아)
- **Cache Fill**: $0.08/GB
- **HTTP 요청**: $0.0075/10,000

**예상 비용** (월 100GB 트래픽, 80% Cache Hit):
- Cache Hit (80GB): $3.20
- Cache Fill (20GB): $1.60
- 요청 (100만): $0.75
- **총 비용: ~$5.55**

**vs. Cloud Storage Direct Egress**: $12.00
**절감액**: **$6.45 (54% 절감)**

### 6.3. CDN 설정

```bash
# Load Balancer용 Backend 생성
gcloud compute backend-buckets create blog-static \
  --gcs-bucket-name=YOUR_BUCKET_NAME \
  --enable-cdn \
  --cache-mode=CACHE_ALL_STATIC

# CDN 캐시 설정
gcloud compute backend-buckets update blog-static \
  --cache-key-include-host \
  --cache-key-include-protocol \
  --default-ttl=3600 \
  --max-ttl=86400

# 캐시 무효화
gcloud compute url-maps invalidate-cdn-cache blog-cdn \
  --path="/images/*"
```

---

## 7. Cloud Logging & Monitoring

### 7.1. 무료 티어
- **로그 저장**: 50GB/월
- **메트릭**: 무료 (기본 메트릭)
- **Alerting**: 무료 (기본 알림)

### 7.2. 로그 확인

```bash
# Cloud Run 로그 확인
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=blog-backend" \
  --limit 50 \
  --format json

# 에러 로그만 필터링
gcloud logging read "resource.type=cloud_run_revision AND severity>=ERROR" \
  --limit 20

# 실시간 로그 스트리밍
gcloud logging tail "resource.type=cloud_run_revision"
```

### 7.3. 모니터링 대시보드

```bash
# 기본 대시보드는 자동 생성됨
# GCP Console → Monitoring → Dashboards

# Custom 메트릭 추가 (선택사항)
# Cloud Monitoring API 사용
```

---

## 8. Cloud Build (CI/CD, 다음 문서에서 상세)

### 8.1. 무료 티어
- **빌드 시간**: 120 빌드-분/일

### 8.2. 비용
- **빌드 시간 (초과)**: $0.003/빌드-분

**예상 비용**: **$0** (무료 티어 내)

---

## 9. 총 비용 시뮬레이션

### 9.1. 시나리오: 개인 블로그 (월 5,000 방문자)

| 서비스 | 무료 티어 | 사용량 | 비용 |
|--------|-----------|--------|------|
| **Cloud Run (Frontend)** | 180k vCPU-초 | 30k vCPU-초 | $0 |
| **Cloud Run (Backend)** | 180k vCPU-초 | 20k vCPU-초 | $0 |
| **Cloud SQL (db-f1-micro)** | 90일 무료 | 1 instance | $0 (90일 후 $10) |
| **Cloud Storage** | 5GB | 3GB | $0 |
| **Artifact Registry** | 0.5GB | 0.4GB | $0 |
| **Secret Manager** | 6 secrets | 4 secrets | $0 |
| **Cloud CDN** | - | 20GB | $1.50 |
| **Cloud Logging** | 50GB | 5GB | $0 |
| **Cloud Build** | 120분/일 | 10분/일 | $0 |
| **Egress (CDN 사용)** | - | 100GB | $4.00 |
| **총 비용** | | | **$5.50/월** |

**90일 무료 티어 종료 후**: **$15.50/월**

### 9.2. 시나리오: 중급 블로그 (월 50,000 방문자)

| 서비스 | 사용량 | 비용 |
|--------|--------|------|
| **Cloud Run (Frontend)** | 300k vCPU-초 | $2.00 |
| **Cloud Run (Backend)** | 200k vCPU-초 | $1.50 |
| **Cloud SQL (db-g1-small)** | 1 instance | $27.00 |
| **Cloud Storage** | 10GB | $0.20 |
| **Cloud CDN** | 500GB | $25.00 |
| **총 비용** | | **$55.70/월** |

---

## 10. 비용 최적화 전략

### 10.1. Cloud Run 최적화
```bash
# Min instances = 0 (Cold Start 허용)
# CPU Throttling 활성화 (요청 없을 때 CPU 사용 안함)
# 적절한 메모리 할당 (512Mi면 충분)
```

### 10.2. Cloud SQL 최적화
```bash
# 개발: db-f1-micro 사용
# 프로덕션: db-g1-small 사용
# 야간/주말: 인스턴스 중지 (개발 환경)

# 자동 스케줄링 (선택사항)
gcloud scheduler jobs create http stop-db \
  --schedule="0 22 * * *" \
  --uri="https://sqladmin.googleapis.com/sql/v1beta4/projects/YOUR_PROJECT/instances/blog-db/stop" \
  --http-method=POST
```

### 10.3. Storage 최적화
```bash
# Lifecycle policy: 90일 후 Nearline
# CDN 활성화 (Egress 비용 절감)
# 이미지 압축 (WebP, AVIF)
```

### 10.4. 예산 알림 설정
```bash
# GCP Console → Billing → Budgets
# 월 $20 초과 시 이메일 알림 설정
```

---

## 11. 리전 선택

### 11.1. 권장 리전
- **asia-northeast3** (서울) - 한국 사용자 대상
- **asia-northeast1** (도쿄) - 서울 미지원 서비스
- **us-central1** (아이오와) - 가장 저렴 (미국 대상)

### 11.2. 리전별 비용 차이
- **서울 (asia-northeast3)**: 100% 기준
- **도쿄 (asia-northeast1)**: 95%
- **아이오와 (us-central1)**: 80%

**권장**: 한국 사용자가 많다면 서울, 글로벌이면 미국

---

## 12. 보안 설정

### 12.1. IAM 최소 권한 원칙
```bash
# Cloud Run에 Cloud SQL 접근 권한만 부여
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member=serviceAccount:YOUR_SERVICE_ACCOUNT \
  --role=roles/cloudsql.client
```

### 12.2. VPC 네트워크
```bash
# Serverless VPC Connector (Cloud Run ↔ Cloud SQL Private IP)
gcloud compute networks vpc-access connectors create blog-connector \
  --network=default \
  --region=asia-northeast3 \
  --range=10.8.0.0/28
```

### 12.3. Cloud Armor (DDoS 방어, 선택사항)
```bash
# Security Policy 생성
gcloud compute security-policies create blog-security-policy

# Rate Limiting 규칙 (초당 100 요청)
gcloud compute security-policies rules create 1000 \
  --security-policy=blog-security-policy \
  --expression="true" \
  --action=rate-based-ban \
  --rate-limit-threshold-count=100 \
  --rate-limit-threshold-interval-sec=60
```

---

## 체크리스트

### 초기 설정
- [ ] GCP 프로젝트 생성
- [ ] Billing 활성화
- [ ] 필요한 API 활성화
- [ ] 리전 선택 (asia-northeast3 권장)

### Cloud Run
- [ ] Frontend 서비스 배포
- [ ] Backend 서비스 배포
- [ ] Auto-scaling 설정
- [ ] 환경변수 설정

### Cloud SQL
- [ ] PostgreSQL 인스턴스 생성
- [ ] 데이터베이스 생성
- [ ] 사용자 생성
- [ ] 백업 설정

### Cloud Storage
- [ ] 버킷 생성
- [ ] Public 액세스 설정
- [ ] CORS 설정
- [ ] Lifecycle 정책 설정

### Secret Manager
- [ ] 데이터베이스 비밀번호 저장
- [ ] JWT Secret 저장
- [ ] IAM 권한 부여

### 모니터링
- [ ] 로깅 확인
- [ ] 메트릭 대시보드 설정
- [ ] 예산 알림 설정

---

이제 GCP 인프라 구축이 완료되었습니다! 다음 단계는 CI/CD 파이프라인 구축입니다. 🚀
