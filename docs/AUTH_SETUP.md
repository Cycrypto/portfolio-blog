# 인증 시스템 설정 가이드

## 개요
이 블로그 애플리케이션은 JWT 기반의 관리자 인증 시스템을 사용합니다.

## 관리자 계정 생성

### 1. 기본 관리자 계정 생성
백엔드 디렉토리에서 다음 명령어를 실행합니다:

```bash
cd backend
npm run create-admin
```

기본 로그인 정보:
- **사용자명**: `admin`
- **비밀번호**: `admin123`
- **이메일**: `admin@example.com`

### 2. 커스텀 관리자 계정 생성
환경 변수를 사용하여 사용자 정의 관리자 계정을 생성할 수 있습니다:

```bash
ADMIN_USERNAME=myuser ADMIN_PASSWORD=mypassword ADMIN_EMAIL=my@email.com npm run create-admin
```

## 로그인 방법

1. 브라우저에서 `/admin/login` 페이지로 이동
2. 사용자명과 비밀번호를 입력
   - 기본 계정: `admin` / `admin123`
3. "로그인" 버튼 클릭
4. 성공 시 자동으로 관리자 대시보드로 이동

⚠️ **보안 권장사항**: 운영 환경 배포 전에 반드시 기본 비밀번호를 변경하세요.

## API 엔드포인트

### 로그인
```http
POST /login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

**응답**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "admin",
    "roles": ["admin"]
  }
}
```

### 개발용 토큰 발급 (개발 환경 전용)
```http
POST /dev-token
```

이 엔드포인트는 운영 환경(`NODE_ENV=production`)에서 자동으로 비활성화됩니다.

**응답 (개발 환경)**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**응답 (운영 환경)**:
```json
{
  "message": "개발용 토큰 발급은 개발 환경에서만 사용 가능합니다."
}
```

## 보안 설정

### JWT 시크릿 키 변경
운영 환경에서는 반드시 `.env` 파일에서 JWT 시크릿 키를 변경해야 합니다:

```env
JWT_SECRET=your-secure-secret-key-here
```

현재 `backend/src/auth/auth.module.ts`에서 하드코딩된 시크릿 키를 환경 변수로 변경하세요:

```typescript
JwtModule.register({
  secret: process.env.JWT_SECRET || 'dev-secret-key',
  signOptions: { expiresIn: '1h' },
}),
```

### 운영 환경 체크리스트
- [ ] JWT 시크릿 키를 안전한 값으로 변경
- [ ] `NODE_ENV=production` 설정 (개발용 토큰 발급 자동 비활성화)
- [ ] HTTPS 사용
- [ ] 관리자 기본 비밀번호 변경 (admin123 → 강력한 비밀번호)
- [ ] CORS 설정 확인
- [ ] 비밀번호 정책 강화 (선택사항)

## 로그아웃
로그아웃은 프론트엔드에서 토큰을 제거하는 방식으로 처리됩니다:

```typescript
import { TokenManager } from '@/lib/auth/token-manager'

TokenManager.clearToken()
```

관리자 페이지에서 제공되는 로그아웃 버튼을 사용할 수 있습니다.

## 권한 시스템

### 사용 가능한 역할
- `admin`: 관리자 권한
- `user`: 일반 사용자 권한

### 엔드포인트 보호
백엔드에서 `@AuthRole` 데코레이터를 사용하여 엔드포인트를 보호할 수 있습니다:

```typescript
import { AuthRole } from '../auth/decorator/auth-role.decorator';

@Post()
@AuthRole('admin')
createPost(@Body() createPostDto: CreatePostDto) {
  // 관리자만 접근 가능
}
```

## 문제 해결

### "사용자명 또는 비밀번호가 올바르지 않습니다" 오류
- 사용자명과 비밀번호가 정확한지 확인
- 관리자 계정이 생성되었는지 확인 (`npm run create-admin`)

### 토큰 만료
- 토큰은 1시간 후 만료됩니다
- 만료 시 다시 로그인해야 합니다

### 데이터베이스 연결 오류
- PostgreSQL이 실행 중인지 확인
- `.env` 파일의 데이터베이스 설정 확인
