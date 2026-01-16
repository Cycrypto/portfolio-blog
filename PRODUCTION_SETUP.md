# 🚀 운영 서버 배포 가이드

## 📋 목차
1. [초기 데이터베이스 설정](#초기-데이터베이스-설정)
2. [관리자 계정 생성](#관리자-계정-생성)
3. [프로필 초기화](#프로필-초기화)
4. [보안 권장사항](#보안-권장사항)

---

## 초기 데이터베이스 설정

### 필수 테이블 확인

Docker Compose로 배포하면 TypeORM이 자동으로 다음 테이블들을 생성합니다:

- ✅ `users` - 사용자 계정
- ✅ `profiles` - 블로그 프로필 정보
- ✅ `posts` - 블로그 게시글
- ✅ `tags` - 게시글 태그
- ✅ `post_tags` - 게시글-태그 관계
- ✅ `comments` - 댓글
- ✅ `contacts` - 문의사항
- ✅ `projects` - 프로젝트 포트폴리오
- ✅ `experiences` - 경력 정보

### 초기 데이터 요구사항

| 항목 | 자동 생성 | 수동 생성 필요 |
|-----|---------|-------------|
| 관리자 계정 | ❌ | ✅ 필수 |
| 프로필 데이터 | ✅ 자동 | - |
| 게시글 | ❌ | 선택 |
| 프로젝트 | ❌ | 선택 |

---

## 관리자 계정 생성

### 방법 1: Docker 컨테이너에서 실행 (권장)

#### Step 1: 서버에 접속
```bash
ssh ubuntu@your-server-ip
cd ~/apps/portfolio-blog
```

#### Step 2: 환경변수 설정
```bash
# docker-compose.prod.yml에 환경변수 추가
nano docker-compose.prod.yml
```

backend 서비스에 다음 환경변수를 추가:
```yaml
backend:
  environment:
    # ... 기존 환경변수들 ...
    - ADMIN_USERNAME=your_admin_username
    - ADMIN_PASSWORD=your_secure_password_here
    - ADMIN_EMAIL=your_email@junha.space
```

**⚠️ 보안 주의사항:**
- 강력한 비밀번호 사용 (최소 8자, 영문+숫자+특수문자)
- 기본값 `admin123` 절대 사용 금지
- 비밀번호는 생성 후 환경변수에서 제거할 것

#### Step 3: 컨테이너 재시작 (환경변수 적용)
```bash
docker-compose -f docker-compose.prod.yml up -d backend
```

#### Step 4: Seed 스크립트 실행
```bash
# 운영 환경용 스크립트 실행
docker-compose -f docker-compose.prod.yml exec backend npm run seed:prod
```

#### Step 5: 결과 확인
성공 시 다음과 같은 출력을 확인할 수 있습니다:
```
✅ 관리자 계정이 성공적으로 생성되었습니다!

═══════════════════════════════════════════════════════════
   계정 정보:
   - 사용자명: your_admin_username
   - 이메일: your_email@junha.space
   - 역할: admin
   - 생성 시각: 2026-01-16T...
═══════════════════════════════════════════════════════════
```

#### Step 6: 환경변수 제거 (보안)
```bash
nano docker-compose.prod.yml
```

생성 완료 후 `ADMIN_PASSWORD` 환경변수를 제거하거나 주석 처리:
```yaml
backend:
  environment:
    - ADMIN_USERNAME=your_admin_username
    # - ADMIN_PASSWORD=your_secure_password_here  # 생성 완료 후 제거
    - ADMIN_EMAIL=your_email@junha.space
```

```bash
# 변경사항 적용
docker-compose -f docker-compose.prod.yml up -d backend
```

---

### 방법 2: 로컬에서 실행 (개발 환경)

```bash
cd backend

# .env 파일에 환경변수 설정
echo "ADMIN_USERNAME=admin" >> .env
echo "ADMIN_PASSWORD=your_password" >> .env
echo "ADMIN_EMAIL=admin@junha.space" >> .env

# 스크립트 실행
npm run seed:prod

# 또는 개발용 스크립트 (기본값 사용)
npm run create-admin
```

---

### 방법 3: 데이터베이스 직접 접근

긴급 상황이나 스크립트 실행이 불가능한 경우:

```bash
# PostgreSQL 컨테이너에 접속
docker-compose -f docker-compose.prod.yml exec db psql -U bloguser -d blog_db
```

```sql
-- bcrypt로 해시된 비밀번호 생성 필요 (온라인 도구 사용)
-- 예: https://bcrypt-generator.com/ 에서 'your_password' 해시 생성

INSERT INTO users (username, password, email, roles, "createdAt", "updatedAt")
VALUES (
  'admin',
  '$2b$10$해시된비밀번호여기입력',
  'admin@junha.space',
  '{admin}',
  NOW(),
  NOW()
);

-- 확인
SELECT id, username, email, roles FROM users WHERE username = 'admin';

\q  -- 종료
```

---

## 프로필 초기화

프로필은 **자동으로 초기화**됩니다!

### 자동 생성 시점
- 첫 번째 API 요청 시 (`GET /api/profile`)
- ID는 항상 `1`로 고정

### 기본 프로필 데이터
```typescript
{
  name: '박준하',
  title: '백엔드 개발자 & 기술 블로거',
  email: 'parkjunha@example.com',
  location: '서울, 대한민국',
  // ... 등등
}
```

### 프로필 수정 방법
1. 관리자 로그인: `https://junha.space/admin`
2. 프로필 편집 메뉴 접속
3. 정보 수정 후 저장

또는 API 직접 호출:
```bash
curl -X PATCH https://api.junha.space/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Your Name",
    "title": "Your Title",
    "email": "your@email.com"
  }'
```

---

## 보안 권장사항

### 1. 관리자 계정 보안

- [ ] 강력한 비밀번호 사용 (최소 12자 이상)
- [ ] 로그인 후 즉시 비밀번호 변경
- [ ] 환경변수에서 `ADMIN_PASSWORD` 제거
- [ ] 정기적인 비밀번호 변경 (3개월마다)
- [ ] 2단계 인증 고려 (향후 구현 권장)

### 2. 데이터베이스 보안

```yaml
# docker-compose.prod.yml
db:
  environment:
    - POSTGRES_PASSWORD=강력한_비밀번호로_변경  # 기본값 변경 필수!
```

- [ ] PostgreSQL 비밀번호 변경 (`blogpass123` → 강력한 비밀번호)
- [ ] 데이터베이스 포트를 외부에 노출하지 않음 (현재 설정 유지)
- [ ] 정기적인 백업 설정

### 3. 환경변수 관리

민감한 정보는 `.env` 파일이나 시크릿 관리 도구 사용:

```bash
# 서버에 .env 파일 생성
nano ~/apps/portfolio-blog/backend/.env
```

```env
# Backend .env
DB_PASSWORD=강력한_db_비밀번호
JWT_SECRET=랜덤_jwt_시크릿_키_최소_32자
```

### 4. 로그 관리

생성된 관리자 계정 정보가 포함된 로그 삭제:
```bash
docker-compose -f docker-compose.prod.yml logs backend | grep -i "password"
# 위험한 로그가 있다면 컨테이너 재시작으로 로그 초기화
docker-compose -f docker-compose.prod.yml restart backend
```

---

## 문제 해결

### 관리자 계정이 생성되지 않아요

1. **데이터베이스 연결 확인**
   ```bash
   docker-compose -f docker-compose.prod.yml logs backend | tail -50
   ```

2. **데이터베이스 테이블 확인**
   ```bash
   docker-compose -f docker-compose.prod.yml exec db psql -U bloguser -d blog_db -c "\dt"
   ```

3. **수동으로 users 테이블 확인**
   ```bash
   docker-compose -f docker-compose.prod.yml exec db psql -U bloguser -d blog_db -c "SELECT * FROM users;"
   ```

### 비밀번호를 잊어버렸어요

비밀번호 재설정:
```bash
# 1. 환경변수에 새 비밀번호 설정
nano docker-compose.prod.yml  # ADMIN_PASSWORD 추가

# 2. 컨테이너 재시작
docker-compose -f docker-compose.prod.yml up -d backend

# 3. 기존 계정 삭제 후 재생성
docker-compose -f docker-compose.prod.yml exec db psql -U bloguser -d blog_db -c "DELETE FROM users WHERE username='admin';"

# 4. Seed 스크립트 재실행
docker-compose -f docker-compose.prod.yml exec backend npm run seed:prod
```

### 관리자 페이지에 접속이 안 돼요

1. **프론트엔드 빌드 확인**
   ```bash
   docker-compose -f docker-compose.prod.yml logs frontend
   ```

2. **API 연결 확인**
   ```bash
   curl https://api.junha.space/auth/dev-token
   ```

3. **Traefik 라우팅 확인**
   ```bash
   docker logs traefik | grep junha.space
   ```

---

## 배포 체크리스트

초기 배포 시 확인사항:

- [ ] Docker Compose 파일 확인
- [ ] PostgreSQL 비밀번호 변경
- [ ] 관리자 계정 생성
- [ ] 관리자 로그인 테스트
- [ ] 프로필 데이터 확인/수정
- [ ] 환경변수에서 민감정보 제거
- [ ] SSL 인증서 작동 확인 (Let's Encrypt)
- [ ] 백업 스크립트 설정
- [ ] 로그 모니터링 설정

---

## 추가 리소스

- [Backend API 문서](http://localhost:3002/api) (Swagger)
- [TypeORM 공식 문서](https://typeorm.io/)
- [NestJS 공식 문서](https://docs.nestjs.com/)

---

**마지막 업데이트:** 2026-01-16
**작성자:** Claude Code
