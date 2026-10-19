# junha.space 배포

현재 앱은 Next.js 16 + Node 24 + SQLite로 실행합니다. DB와 업로드 이미지는
`portfolio-blog-data-v2` Docker 볼륨에 저장합니다. `coffeenote`, `brain`을 포함한
서브도메인은 이 앱의 Traefik 라우팅에 포함하지 않습니다.

## 운영 서버

- SSH: `ubuntu@100.76.8.11` (Tailscale)
- 기본 경로: `/home/ubuntu/apps/portfolio-blog`
- 릴리스: 기본 경로 아래 `releases/<commit SHA>`
- 현재 릴리스 링크: 기본 경로 아래 `current`
- 설정: 기본 경로 아래 `.env.portfolio` (권한 600, Git에 저장하지 않음)
- Compose 프로젝트: `portfolio-next`
- 로컬 확인 주소: `http://127.0.0.1:13000/api/health`

## 공개 접속: Cloudflare Tunnel

`junha.space`는 개인 Cloudflare 계정의 `junha-portfolio` 터널을 통해
서버의 `http://127.0.0.1:13000`에 연결합니다. Tailscale은 서버 관리와
SSH 배포에 사용합니다. 공개 웹 접속에는 Tailscale 설치가 필요하지 않습니다.
공유기 인바운드 포트 개방이나 기존 Traefik 인증서 갱신에 의존하지 않습니다.

- Cloudflare 계정: `Jh01love00@gmail.com's Account`
- 터널 ID: `085a255d-76c6-4aba-935a-eddcd80ff6c2`
- 네임서버: `fattouche.ns.cloudflare.com`, `jean.ns.cloudflare.com`
- 루트 DNS: 프록시가 활성화된 CNAME → `<터널 ID>.cfargotunnel.com`
- 공개 경로: `junha.space` 전체 → `http://127.0.0.1:13000`
- 서버 커넥터 경로: `/home/ubuntu/apps/portfolio-blog/tunnel`

커넥터는 앱과 분리된 `portfolio-tunnel` Compose 프로젝트로 실행합니다.
`docker-compose.tunnel.yml`을 커넥터 경로의 `docker-compose.yml`로 복사하고,
해당 터널의 토큰을 같은 디렉터리의 `tunnel-token` 파일에 권한 600으로
저장합니다. 디렉터리 권한은 700으로 유지합니다. 토큰을 Git이나 명령행
인수에 넣지 않습니다. 다른 위치의 토큰은 `CLOUDFLARE_TOKEN_FILE`로 지정합니다.
현재 서버의 ubuntu UID/GID는 1000이며 Compose의 실행 사용자와 일치합니다.

```bash
cd /home/ubuntu/apps/portfolio-blog/tunnel
docker compose up -d
curl --fail http://127.0.0.1:20243/ready
```

`coffeenote`와 `brain` 컨테이너는 중지했으며 이 터널에는 연결하지 않습니다.
DNS 이전 시 기존 메일 MX·SPF·DKIM·DMARC 및 다른 서브도메인 레코드를 보존합니다.

기존 저장소의 운영 Compose 파일과 환경변수를 덮어쓰지 않도록 릴리스를
별도 디렉터리에 추출합니다. 기존 컨테이너나 PostgreSQL·MinIO 볼륨을
일괄 삭제하는 명령은 사용하지 않습니다.

## 첫 배포

서버의 기존 `junha.space` 프론트엔드에서 Traefik 네트워크, HTTPS 엔트리포인트,
인증서 resolver를 확인합니다. `.env.portfolio.example`을 참고해 서버의
`.env.portfolio`에 이 값과 새 관리자 비밀번호를 저장합니다.

배포할 커밋을 기본 경로의 Git 저장소에 fetch한 뒤 다음 순서로 실행합니다.

```bash
cd /home/ubuntu/apps/portfolio-blog
git fetch origin main
export DEPLOYMENT_VERSION=$(git rev-parse origin/main)
release_dir="$PWD/releases/$DEPLOYMENT_VERSION"
mkdir -p "$release_dir"
git archive "$DEPLOYMENT_VERSION" | tar -x -C "$release_dir"
bash "$release_dir/scripts/deploy.sh" "$PWD"
```

배포 스크립트는 운영 라우팅이 없는 임시 컨테이너에서 새 이미지를 먼저
검증합니다. 성공하면 영구 볼륨을 사용하는 앱을 시작하고 헬스체크를
기다립니다. 실패하면 이전 릴리스를 복원하거나 첫 배포 컨테이너를 중지합니다.
배포 후 `https://junha.space`의 홈, `/blog`, `/series`, `/admin/login` 및
정적 이미지가 새 화면으로 표시되는지 확인합니다.

서버의 외부 DNS나 이미지 레지스트리에 문제가 있으면 다른 장비에서 서버
아키텍처(`linux/amd64`)에 맞춰 이미지를 빌드하고 `docker save` / `docker load`로
전송할 수 있습니다. 동일한 커밋의 소스도 릴리스 디렉터리로 전송한 뒤
`DEPLOY_PREBUILT=1`을 설정해 배포 스크립트를 실행합니다. 이 모드는 서버에서
소스 fetch나 이미지 빌드를 수행하지 않고 이미 존재하는 릴리스 이미지를 검증합니다.

## 재배포와 복구

관리자 비밀번호와 DB는 릴리스 밖에 보관됩니다. 재배포할 때 기존 볼륨을
재사용하며, 이미지를 바꿔도 게시글과 업로드 파일이 남습니다.
이전 릴리스로 복구하려면 그 릴리스의 전체 커밋 SHA를 `DEPLOYMENT_VERSION`으로
설정하고 해당 디렉터리의 배포 스크립트를 실행합니다.

DB 백업은 실행 중인 SQLite 파일을 단순 복사하지 말고 SQLite backup API로
생성하고, 업로드 파일도 함께 보관합니다. 초기화가 필요할 때는 앱을 중지한 뒤
이 앱의 전용 볼륨만 대상으로 처리합니다.

## GitHub Actions

CI는 Node 24에서 단위 테스트·빌드·타입 검사와 Chromium E2E 테스트를 실행합니다.
배포 워크플로는 성공한 main CI의 **커밋 SHA**를 그대로 배포합니다.

배포에 사용하는 시크릿:

- `DEPLOY_SSH_PASSWORD`: 서버 ubuntu 계정의 기존 SSH 인증
- `TS_OAUTH_CLIENT_ID` + `TS_OAUTH_SECRET` 또는 기존 이름 `TS_OAUTH_PASSWORD`
- OAuth를 사용하지 않는 경우 `TAILSCALE_AUTHKEY`

`TAILSCALE_TAGS` 저장소 변수로 OAuth에 허용된 태그를 지정합니다. 기본값은
`tag:ci`입니다. 2026-10-19 점검 시 기존 auth key는 무효였고 OAuth의 `tag:ci`
요청은 거부됐습니다. 자동 배포 전 OAuth 클라이언트의 태그 권한을 수정하거나
올바른 태그로 변수를 설정해야 합니다. 로컬 Tailscale + SSH 직접 배포도 가능합니다.
