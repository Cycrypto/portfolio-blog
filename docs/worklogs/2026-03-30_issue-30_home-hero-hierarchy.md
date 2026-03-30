# 작업 로그: blog/project listings editorial hierarchy

## 기본 정보
- 작성일: 2026-03-30
- GitHub Issue: #30
- 브랜치: `codex/ui-editorial-listings`
- 작업자: Codex

## 작업 목표
- 블로그와 프로젝트 목록의 카드 중심 표현을 줄이고, 더 명확한 스캔 구조와 정보 위계를 가진 목록형 레이아웃으로 재구성한다.
- 이미지, 메타, 설명, CTA의 우선순위를 정리하되 홈 hero, 관리자 레이아웃, 백엔드 모델 변경은 범위에서 제외한다.
- 사용자 요청에 따라 로그 파일명은 `home-hero-hierarchy` slug를 유지한다.

## 작업 내역
### 1. 분석
- `/Users/cycrpto/Desktop/my-blog/AGENTS.md`의 GitHub Issue And Worktree Flow와 `/Users/cycrpto/Desktop/my-blog/docs/worklogs/README.md` 규칙을 먼저 확인했다.
- GitHub issue #30 본문에서 `Suggested Branch: codex/ui-editorial-listings`와 `Work Status` 체크리스트를 확인했다.
- `git worktree add -b codex/ui-editorial-listings /Users/cycrpto/.codex/worktrees/issue-30-editorial-listings main`으로 전용 worktree를 생성했다.
- issue `Work Status`를 `진행 중`으로 업데이트했다.
- `frontend/components/blog/blog-card.tsx`, `frontend/components/project/project-list.tsx`, 그리고 해당 컴포넌트를 사용하는 공개 페이지를 우선 확인 대상으로 잡았다.
- 블로그는 홈과 `/blog`가 같은 `BlogCard`를 재사용하고, 프로젝트는 홈과 `/projects`가 같은 `ProjectList`를 재사용한다는 점을 확인했다.

### 2. 구현
- `BlogCard`를 카드 박스 기반 레이아웃에서 `featured` / `list` variant를 지원하는 에디토리얼 row 컴포넌트로 재구성했다.
- `/blog` 페이지는 첫 글을 featured entry로 올리고 나머지 글은 divider 기반 list row로 렌더링하도록 변경했다.
- 홈의 최신 글 섹션도 동일한 정보 위계를 사용하도록 맞췄다.
- `ProjectList`는 첫 프로젝트를 설명 중심 featured row로 분리하고, 나머지 프로젝트는 메타/연결 글/외부 링크를 한 줄 흐름에 가깝게 정리했다.
- 프로젝트 featured 영역의 보조 제목은 영문 대신 `관련 글`로 맞췄고, 블로그 row에서 태그가 없을 때는 빈 메타 줄이 생기지 않게 정리했다.

### 3. 범위 조정
- issue의 Out of Scope에 맞춰 홈 hero, 관리자 레이아웃, 백엔드 모델은 수정하지 않았다.
- 홈 공개 페이지는 별도 섹션 구조를 바꾸지 않고, 이슈 범위 컴포넌트를 재사용하는 목록 구간만 함께 업데이트했다.

## 설계 결정 기록
### 결정 1. 이슈 전용 worktree를 Suggested Branch 그대로 생성
- 배경: AGENTS.md에서 issue 기반 작업은 Suggested Branch와 전용 worktree 사용을 요구한다.
- 선택: `codex/ui-editorial-listings` 브랜치를 새로 만들고 `/Users/cycrpto/.codex/worktrees/issue-30-editorial-listings` 경로에 분리된 worktree를 생성했다.
- 이유: 다른 detached worktree나 기존 작업 브랜치와 범위가 섞이지 않도록 하기 위함이다.
- 대안: 현재 worktree에서 바로 브랜치를 만들어 작업하는 방법.
- 영향: 이후 모든 구현, 검증, 로그 업데이트는 새 worktree에서만 진행한다.

### 결정 2. 블로그 목록은 첫 글 featured + 나머지 list row 구조로 통일
- 배경: 기존 3열 카드 그리드는 목록 콘텐츠의 스캔 순서를 약하게 만들고, 이미지/배지/버튼이 모두 같은 강도로 경쟁했다.
- 선택: 첫 글만 큰 제목과 이미지가 있는 featured row로 노출하고, 나머지는 border divider 기반 row로 정리했다.
- 이유: issue의 acceptance criteria인 "카드가 꼭 필요한 곳에만 사용"과 "제목, 설명, 메타, CTA의 우선순위 일관성"을 동시에 만족시키기 쉽다.
- 대안: 카드 스타일은 유지한 채 padding과 그림자만 줄이는 방법, 모든 글을 동일한 text row로 바꾸는 방법.
- 영향: 홈의 최신 글 섹션과 `/blog` 페이지가 같은 정보 위계를 공유하게 되어 목록 경험이 일관된다.

### 결정 3. 프로젝트 목록은 보조 정보를 우측 별도 컬럼보다 본문 흐름에 더 가깝게 배치
- 배경: 기존 row는 본문과 액션 링크가 좌우로 분리되어 있어 시선이 자주 끊기고, 메타/관련 글/외부 링크 밀도가 높았다.
- 선택: 첫 프로젝트만 featured 소개형 row로 분리하고, 일반 row는 제목 아래에 관련 글 또는 설명을 두고 스택/외부 링크는 하단 inline 메타로 묶었다.
- 이유: 프로젝트 제목과 연결 글이 우선 읽히고, 코드/서비스 링크는 보조 액션으로 남길 수 있다.
- 대안: 모든 프로젝트를 동일한 2컬럼 구조로 유지하는 방법, 카드형 showcase 섹션으로 바꾸는 방법.
- 영향: 모바일에서는 한 컬럼 흐름이 자연스럽고, 데스크톱에서는 featured row만 더 큰 소개 역할을 맡는다.

## 검증
- 실행한 테스트:
  - `npm ci --prefix frontend`
  - `npm run build --prefix frontend` 2회 실행, 모두 성공
  - `npx tsc --noEmit -p frontend/tsconfig.json` 실행
  - `NEXT_PUBLIC_API_URL=http://127.0.0.1:3002 npm run start --prefix frontend -- --hostname 127.0.0.1 --port 3000` 로컬 서버 실행
- 수동 확인:
  - 임시 mock API를 3002 포트에 띄운 뒤 홈(`/`)과 프로젝트(`/projects`) 페이지를 실제 렌더링해 featured/list 구조와 주요 텍스트가 응답 HTML에 반영되는 것을 확인했다.
  - 브라우저 MCP는 로컬 Chrome 세션 충돌로 사용할 수 없어서, 시스템 Chrome headless DOM dump로 대체 검증했다.
- 확인하지 못한 항목:
  - `/blog` 페이지는 client fetch 기반이라 headless dump 검증이 불안정했고, 실제 브라우저 스냅샷까지는 확보하지 못했다.
  - `npm run lint --prefix frontend`는 저장소에 ESLint 실행 환경이 설치되지 않아 수행되지 않았다.
  - `npx tsc --noEmit -p frontend/tsconfig.json`는 이번 변경과 무관한 기존 타입 오류들(`frontend/app/api/resume/route.ts`, `frontend/components/home/*`, `frontend/components/ui/*`) 때문에 실패했다.

## 남은 이슈 / 후속 작업
- `/blog` 페이지의 실제 모바일 스냅샷 검증은 브라우저 환경이 정상일 때 한 번 더 확인하는 편이 안전하다.
- 프론트엔드 lint/tsc 환경 자체의 기존 오류가 남아 있어, 저장소 차원의 정리가 없으면 자동 검증 신뢰도가 제한된다.
