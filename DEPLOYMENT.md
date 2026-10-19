# junha.space 포트폴리오 배포

Next.js 16 + Node 24 + SQLite로 메인 화면과 관리자 편집만 제공합니다.
공개 화면은 `/`, 관리자는 `/admin`, 보호된 읽기·저장 API는 `/api/admin/home`입니다.
블로그·시리즈·미디어 관리·별도 이력서 페이지와 비밀번호 로그인은 제거했습니다.
`/api/health`는 컨테이너 상태 확인용입니다.

## Cloudflare Access 설정

Cloudflare Tunnel과 Access는 별도입니다. 기존 터널만으로는 관리자 인증이 설정되지 않습니다.

2026-10-19 개인 계정 `Jh01love00@gmail.com's Account`에 아래 앱·정책을 생성했습니다.
Team domain은 `proud-brook-7113.cloudflareaccess.com`이며 실제 AUD는 Git에서 제외한
로컬 `.env.local`, `.env.portfolio`에 저장했습니다. 운영 서버의 `.env.portfolio`에도
같은 값을 등록했으며, 이후 릴리스에서도 이 설정을 유지합니다.

1. Cloudflare One → Access controls → Applications에서 Self-hosted 앱 `Portfolio Admin`을 만듭니다.
2. 같은 앱에 공개 hostname 두 개를 등록합니다: `junha.space/admin`, `junha.space/api/admin`.
   이 경로들은 하위 경로도 보호합니다. `/` 전체를 지정하지 않아야 포트폴리오가 공개됩니다.
3. `Portfolio Administrators` Allow 정책을 만들고 Include → Emails에
   `jh01love00@gmail.com`만 지정합니다. 정책에서 관리자 이메일/그룹의 추가·제거를 관리합니다.
   Everyone, Bypass, Service Auth 정책은 관리자 앱에 연결하지 않습니다.
4. 로그인 방법은 기존 계정의 Identity Provider 또는 이메일 One-time PIN을 사용합니다.
5. 앱의 Application Audience (AUD)와 계정 Team domain을 아래 환경변수에 넣습니다.

```dotenv
CF_ACCESS_TEAM_DOMAIN=your-team.cloudflareaccess.com
CF_ACCESS_AUD=your-administrator-application-aud
SITE_URL=https://junha.space
DATA_DIR=/app/data
```

앱은 `Cf-Access-Jwt-Assertion`의 RS256 서명·발급자·AUD·만료를 검증합니다.
이 관리자 Access 앱의 Allow 정책을 통과한 사용자에게만 `admin` 역할과
`home:read`, `home:write` 권한을 부여합니다. 이메일 헤더나 임의의 role 필드를
신뢰하지 않으며, 다른 Access 앱의 토큰과 서비스 토큰은 거절합니다.
각 페이지 요청과 API에서 권한을 확인합니다. 저장 요청은 `SITE_URL`과
동일한 Origin이어야 합니다. 설정이 없으면 API는 503, 인증 실패는 401,
권한 또는 Origin 오류는 403을 반환하며 편집 화면을 제공하지 않습니다.
별도 앱 비밀번호나 개발용 인증 우회는 없습니다.

원본은 Cloudflare의 [JWT 검증 문서](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/)와
[경로 보호 문서](https://developers.cloudflare.com/cloudflare-one/access-controls/policies/app-paths/)를 참고합니다.

## 콘텐츠와 DB 마이그레이션

현재 Pencil `rowland.framer.website` 프레임의 원본 문구·이미지를 최초 DB 값으로 저장합니다.
`/admin`에서 소개·프로필·내비게이션·경력·학력·자격·기술·언어·추천·연락처·푸터를
편집하고 항목을 추가·삭제·정렬할 수 있습니다. 각 이미지 필드에서 PNG·JPG·WebP 파일을
직접 업로드하거나 기존 에셋 이름·내부 경로·HTTPS URL을 지정합니다. 업로드는 10MB,
가로·세로 8192px, 총 2500만 픽셀 이하의 정지 이미지를 허용하며 실제 디코딩 후 메타데이터를
제거한 WebP로 저장합니다. `/api/admin/images`는 동일한 Access 권한·Origin 검증을 거칩니다.
파일은 영구 볼륨의 `portfolio-images/`에 보관하며 `/portfolio-images/<hash>.webp`로 제공합니다.
이미지는 업로드 후 변경사항을 저장해야 공개 메인에 반영됩니다. 편집기의 미리보기는 저장 전 내용을 표시합니다.

저장 시 SQLite의 `home_content` 단일 행을 갱신하고 버전을 증가시킵니다.
다른 탭이 먼저 저장했으면 409를 반환해 덮어쓰기를 막습니다. 최신 저장자도 DB에 기록합니다.
재시작·재배포 후에도 `portfolio-blog-data-v2` 영구 볼륨의 DB를 재사용합니다.
브라우저의 임시 복구 사본은 탭에만 보관하며 서버 저장과 별개입니다.

**첫 실행 시 마이그레이션은 기존 홈/소개를 옮긴 후 posts, series, media,
sessions, login_attempts, settings 테이블을 삭제합니다.** 이전 블로그 DB를 보관하려면
업데이트 전에 SQLite backup API로 별도 백업을 만드세요. 기존 업로드 파일은
더 이상 서비스하지 않습니다. 이전 릴리스 복구 시 이전 DB 백업도 함께 복원해야 합니다.
잘못된 기존 홈 데이터는 마이그레이션을 롤백하며 조용히 덮어쓰지 않습니다.

## 운영 서버와 릴리스

- SSH: `ubuntu@100.76.8.11` (Tailscale)
- 기본 경로: `/home/ubuntu/apps/portfolio-blog`
- 릴리스: `releases/<commit SHA>`, 현재 링크: `current`
- 설정: `.env.portfolio` (권한 600, Git 제외)
- Compose 프로젝트: `portfolio-next`
- 로컬 헬스체크: `http://127.0.0.1:13000/api/health`

`.env.portfolio.example`의 CF 설정과 기존 Traefik 네트워크·인증서 설정을 넣습니다.
Docker 포트는 서버의 `127.0.0.1:13000`에만 연결합니다. 기존 전용
Cloudflare Tunnel `junha-portfolio`가 `junha.space`를 이 주소로 전달합니다.
다른 서브도메인·앱·볼륨은 변경하지 않습니다.

```bash
cd /home/ubuntu/apps/portfolio-blog
git fetch origin main
export DEPLOYMENT_VERSION=$(git rev-parse origin/main)
release_dir="$PWD/releases/$DEPLOYMENT_VERSION"
mkdir -p "$release_dir"
git archive "$DEPLOYMENT_VERSION" | tar -x -C "$release_dir"
bash "$release_dir/scripts/deploy.sh" "$PWD"
```

배포 스크립트는 임시 컨테이너의 홈·삭제된 블로그의 404·인증 없는 저장 API의 401과
헬스체크를 검증한 뒤 운영 컨테이너를 교체합니다. 실패하면 이전 이미지를 복원합니다.
`DEPLOY_PREBUILT=1`은 같은 SHA의 사전 빌드 이미지를 사용합니다.

터널 커넥터는 `/home/ubuntu/apps/portfolio-blog/tunnel`의 별도 Compose로 유지합니다.
`docker-compose.tunnel.yml`과 `tunnel-token` 파일을 사용하며 토큰 파일 권한은 600,
디렉터리 권한은 700입니다. 토큰을 Git이나 명령행 인수에 넣지 않습니다.

## 로컬 검증과 CI

```bash
npm ci
npm test
npm run build
npm run typecheck
npx playwright install chromium
npm run test:e2e
```

E2E는 전용 `data/e2e` DB와 매 실행 생성한 RSA 키를 사용합니다. 테스트 프로세스만
Cloudflare 공개 키 응답을 대체하며, 앱의 JWT 검증은 그대로 실행합니다.
테스트용 인증 우회는 운영 코드에 포함하지 않습니다.

CI는 Node 24에서 테스트·빌드·타입 검사·Chromium E2E와 컨테이너 검증을 실행합니다.
기존 Tailscale 배포 워크플로는 통과한 main 커밋 SHA를 배포합니다.
서버의 `.env.portfolio`에 CF 환경변수가 없으면 Compose는 배포를 중단합니다.
