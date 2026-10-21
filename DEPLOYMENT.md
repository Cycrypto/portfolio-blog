# junha.space 포트폴리오 배포

Next.js 16 + Node 24 + SQLite로 메인 화면과 관리자 편집만 제공합니다.
공개 화면은 `/`, 관리자는 `/admin`, 보호된 읽기·저장 API는 `/api/admin/home`입니다.
글 작성·미디어 관리는 Ghost에서, 시리즈 구성은 이 앱의 `/admin/series`에서 관리합니다.
별도 이력서 페이지와 비밀번호 로그인은 이 앱에서 제거했습니다.
블로그는 아래 「blog.junha.space 블로그 (Ghost)」의 별도 Ghost 서비스로 운영합니다.
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

시리즈 관리의 실제 Ghost 연동은 새 일회용 로컬 Ghost를 준비한 뒤
`SERIES_QA_URL=http://127.0.0.1:13002 npm run test:series:live`로 확인합니다.
이 검사는 초기 설정이 완료된 사이트에서는 실행을 거부하며, 테스트 사이트의 최초 계정·통합·글을 생성합니다.
연동 저장뿐 아니라 공개 목록·목차·이전/다음 편까지 브라우저로 확인합니다. 완료 후 일회용 컨테이너를 제거합니다.

E2E는 전용 `data/e2e` DB와 매 실행 생성한 RSA 키를 사용합니다. 테스트 프로세스만
Cloudflare 공개 키 응답을 대체하며, 앱의 JWT 검증은 그대로 실행합니다.
테스트용 인증 우회는 운영 코드에 포함하지 않습니다.

CI는 Node 24에서 테스트·빌드·타입 검사·Chromium E2E와 컨테이너 검증을 실행합니다.
기존 Tailscale 배포 워크플로는 통과한 main 커밋 SHA를 배포합니다.
서버의 `.env.portfolio`에 CF 환경변수가 없으면 Compose는 배포를 중단합니다.

## blog.junha.space 블로그 (Ghost)

블로그는 CV와 같은 서버·저장소에서 별도 Compose 프로젝트 `junha-blog`로 운영합니다.
`docker-compose.blog.yml`은 Ghost 6.71(`ghost/Dockerfile`로 테마를 넣은 이미지)과
MySQL 8.0.44를 띄우고, Ghost를 서버의 `127.0.0.1:13001`에만 연결합니다.
데이터는 `junha-blog-content`(이미지·테마·설정), `junha-blog-mysql`(글·계정) 볼륨에 보관합니다.
CV 컨테이너·볼륨·포트와 공유하는 것은 없습니다.

테마 원본은 `ghost/theme`이며 승인한 Pencil 시안(글 목록·태그별 목록·글 상세·검색·404)을 따릅니다.
컨테이너가 시작될 때마다 이미지에 든 테마로 `content/themes/junha`를 교체하므로
관리자 화면에서 테마 ZIP을 올릴 필요가 없습니다. Ghost 기본 검색과 Portal은 끄고,
테마의 검색 대화상자가 Content API로 제목·요약·태그를 검색합니다.

### 시리즈 작성과 순서 변경

1. `https://junha.space/admin/series`에 관리자 계정으로 접속합니다. 홈 편집 화면의 **블로그 시리즈** 메뉴에서도 열 수 있습니다.
2. **새 시리즈 만들기**에서 이름과 소개를 입력합니다. 기존 시리즈는 자동으로 불러옵니다.
3. **글 추가**에서 제목을 검색하고 **추가**를 누른 뒤 **저장**합니다.

기본은 먼저 발행한 글부터 자동으로 정렬합니다. 초안·예약 글도 미리 담을 수 있으며,
블로그에는 실제 발행 후에 나타납니다. 순서를 바꾸려면 글을 드래그하거나 위·아래 버튼을 누른 뒤 저장합니다.
**발행일순으로 되돌리기**를 누르면 자동 정렬로 돌아갑니다. 시리즈에서 글을 빼도 원문은 삭제되지 않습니다.
이름·소개도 같은 화면에서 수정합니다. 이름을 바꿔도 시리즈 URL은 유지됩니다.

#### 최초 서버 연결

Ghost 설정 → Integrations → Custom Integration에서 시리즈 관리용 통합을 만들고,
서버의 `.env.portfolio`에 `GHOST_ADMIN_URL=https://blog.junha.space`와
`GHOST_ADMIN_API_KEY=<Admin API key>`를 설정한 뒤 포트폴리오 컨테이너를 다시 생성합니다.
Content API key가 아닌 **Admin API key**를 사용합니다. 키는 서버에서만 사용하며 브라우저에 보내지 않습니다.
`.env.local`에도 같은 변수를 넣으면 로컬 관리자에서 연결할 수 있습니다.
기존 Cloudflare Access 관리자 앱이 `/admin/*`와 `/api/admin/*`를 모두 보호해야 합니다.
테마에도 정렬 규칙이 추가되므로 포트폴리오 앱과 Ghost 테마를 함께 배포합니다.

#### 내부 저장 규칙

- 시리즈는 공개 태그(`series-`로 시작하는 slug)로 저장합니다. 새 slug는 화면에서 자동으로 만듭니다.
- 관리 화면이 `#series-order-<시리즈 ID>-<번호>` 내부 태그를 자동으로 관리합니다.
  자동 정렬은 같은 접두어의 `auto` 태그로 표시합니다. 직접 태그나 번호를 입력할 필요가 없습니다.
- 시리즈마다 순서가 독립적입니다. 이전의 `#series-order-1` 형식도 계속 읽으며,
  관리 화면에서 저장한 시리즈는 해당 시리즈 전용 설정을 우선합니다.
- 수동 정렬한 시리즈에 새 글을 추가하면 마지막에 붙습니다. 자동 정렬은 발행일·글 ID 순입니다.
- 글 본문·제목·URL·발행 상태·발행일과 다른 주제 태그는 변경하지 않습니다.
- 저장 전에 변경 여부를 확인하고 글별 `updated_at`으로 충돌을 검사합니다.
  Ghost에는 여러 글을 묶는 트랜잭션이 없으므로 도중 실패하면 일부 반영 가능성을 알리고 새로 불러오도록 안내합니다.
- 공개 글의 목차·이전/다음 편·시리즈 목록은 같은 정렬 규칙을 사용합니다. JavaScript가 꺼져 있으면 발행일순 링크가 남습니다.
  100편을 넘는 목록도 다음 페이지까지 읽습니다. 모바일 목차는 접힌 상태로 시작합니다.

### 서버 최초 설정

1. `.env.blog.example`을 `/home/ubuntu/apps/portfolio-blog/.env.blog`로 복사하고 `chmod 600`합니다.
   DB 비밀번호 두 개는 `openssl rand -base64 32`처럼 긴 임의 값을 넣습니다.
2. SMTP를 입력합니다. Ghost 6은 새 기기에서 관리자 로그인할 때 이메일 인증 코드를 보내므로
   메일 없이는 로그인이 막힙니다. Gmail이면 앱 비밀번호와 `smtp.gmail.com:465`를 씁니다.
   SMTP를 아직 준비하지 못했다면 `GHOST_STAFF_DEVICE_VERIFICATION=false`로 두고
   아래 Cloudflare Access 보호를 반드시 먼저 켭니다. 배포 스크립트는 둘 다 없으면 중단합니다.
3. Cloudflare Zero Trust → Networks → Tunnels의 기존 `junha-portfolio` 터널에 Public hostname
   `blog.junha.space` → `http://127.0.0.1:13001`을 추가합니다. DNS CNAME은 자동으로 생깁니다.
4. Access → Applications에 Self-hosted 앱 `Blog Admin`을 만들고 hostname
   `blog.junha.space/ghost`에 기존 `Portfolio Administrators` Allow 정책을 연결합니다.
   이 경로는 `/ghost/api/content`도 덮으므로, 검색을 위해 `blog.junha.space/ghost/api/content`에
   Bypass(Everyone) 정책만 있는 앱 `Blog Content API`를 하나 더 만듭니다.
   첫 배포 전에 설정해야 다른 사람이 최초 관리자 계정을 먼저 만들 수 없습니다.
5. 배포 후 `https://blog.junha.space/ghost`에서 소유자 계정을 만들고 한 번만 설정합니다.
   - Settings → Design → Change theme → Installed에서 `junha` 활성화
   - General: 사이트 제목 `Junha`, Publication language `ko`, Timezone `Asia/Seoul`
   - Brand accent color `#AD3B25`
   - Navigation → Secondary: 목록 상단 필터(예: 개발 `/tag/dev/`, 인프라 `/tag/infra/`, 회고 `/tag/retrospective/`).
     비워 두면 글이 있는 공개 태그를 이름순으로 모두 보여줍니다.
   - Design → Site-wide: CV URL(기본 `https://junha.space`), GitHub URL(비우면 푸터에서 숨김)
   - Membership → Subscription access: Nobody (테마에 가입 화면이 없습니다)

### 배포와 롤백

배포 워크플로는 CV 배포가 끝난 뒤 서버에 `.env.blog`가 있으면 `scripts/deploy-blog.sh`를 실행합니다.
수동 배포는 릴리스 디렉터리에서 `bash scripts/deploy-blog.sh /home/ubuntu/apps/portfolio-blog`입니다.

- 이미지 태그는 `ghost/`의 테마·이미지 정의와 Compose 파일의 해시입니다. CV만 바뀐 릴리스는
  블로그 컨테이너를 그대로 둡니다.
- 테마나 Ghost 버전이 바뀌면 먼저 DB와 콘텐츠를 백업하고 Ghost를 교체한 뒤
  `/ghost/api/admin/site/`와 홈 응답을 확인합니다. 실패하면 이전 이미지로 되돌립니다.
  Ghost가 이미 DB를 마이그레이션했다면 방금 만든 백업을 복원합니다.
- 서버 전용 설정(메모리 제한, 고정 서브넷 등)은 `docker-compose.blog.override.yml`을 기본 경로에 두면 함께 적용됩니다.
- Ghost 업그레이드는 `ghost/Dockerfile`과 `docker-compose.blog.yml`의 `ghost:6.71.0-alpine`을 함께 올리고
  CI의 gscan·부팅 검사를 통과시킨 뒤 배포합니다.

### 백업과 복원

기본 경로에서 `bash current/scripts/backup-blog.sh "$PWD"`를 실행하면
`backups/blog/<UTC 시각>/`에 `ghost.sql.gz`(mysqldump)와 `content.tar.gz`를 만들고
최근 10개(`BLOG_BACKUP_KEEP`)만 남깁니다. 정기 백업은 서버 crontab에 등록합니다.

```cron
30 3 * * * cd /home/ubuntu/apps/portfolio-blog && mkdir -p backups && bash current/scripts/backup-blog.sh "$PWD" >> backups/blog.log 2>&1
```

복원은 기본 경로에서 `bash current/scripts/restore-blog.sh backups/blog/<시각>`입니다. Ghost를 멈추고 DB와 콘텐츠 볼륨을
백업 시점으로 바꾼 뒤 다시 시작합니다. 서버 밖으로 옮겨 둘 백업은 `backups/blog`를 복사합니다.

### 로컬 확인

```bash
npm ci --prefix ghost
npm run validate --prefix ghost          # gscan, Ghost 6 기준
npm test --prefix ghost                  # 시리즈 정렬 규칙
export BLOG_URL=http://127.0.0.1:13001 GHOST_DB_PASSWORD=local-db MYSQL_ROOT_PASSWORD=local-root \
  GHOST_STAFF_DEVICE_VERIFICATION=false
docker compose -f docker-compose.blog.yml up -d --build --wait
npm run smoke --prefix ghost              # 새 스택 전용: 관리자·테마 설정, 일반 글과 12편·101편 시리즈 생성
npm exec --prefix ghost -- playwright install chromium
npm run test:browser --prefix ghost       # 시리즈 목차·이동·모바일 회귀 검사
docker compose -f docker-compose.blog.yml down -v
```

스모크 스크립트는 예시 글을 만들고 기존 글을 지울 수 있으므로 운영 사이트에 실행하지 않습니다.
CI의 `blog` 작업도 같은 순서로 테마 검사와 Ghost 부팅·화면 확인을 실행합니다.
