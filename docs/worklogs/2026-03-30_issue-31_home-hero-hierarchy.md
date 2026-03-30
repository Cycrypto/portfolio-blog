# 작업 로그: 관리자 shadcn sidebar 전환

## 기본 정보
- 작성일: 2026-03-30
- GitHub Issue: #31
- 브랜치: `codex/ui-admin-sidebar-foundation`
- 작업자: Codex

## 작업 목표
- 관리자 레이아웃의 기존 커스텀 `AdminShell`/`AdminSidebar` 구조를 점검하고, 이슈 본문 범위 안에서 shadcn `sidebar` primitive 기반 구조로 재정리한다.
- 모바일 sheet, 데스크톱 sidebar, 헤더와 본문 계층을 일관되게 맞춘다.
- 사용자 요청에 따라 로그 파일명은 `home-hero-hierarchy`를 사용하지만, 실제 작업 범위는 이슈 #31의 관리자 sidebar 작업임을 명시한다.

## 작업 내역
### 1. 분석
- 이슈 #31 본문에서 `Suggested Branch`가 `codex/ui-admin-sidebar-foundation`임을 확인했다.
- 이슈 `Work Status`를 `진행 중`으로 갱신했다.
- 전용 worktree `/Users/cycrpto/.codex/worktrees/issue-31/portfolio-blog`를 생성했다.
- 현재 관리자 레이아웃은 `frontend/components/admin/AdminShell.tsx`에서 자체 `Sheet`와 `AdminSidebar`를 조합하고 있고, `frontend/components/ui/sidebar.tsx`의 공용 primitive는 아직 쓰지 않는 상태임을 확인했다.
- `shadcn` 스킬 기준에 따라 `npx shadcn@latest info --json`, `npx shadcn@latest docs sidebar`를 조회해 이미 `sidebar` 컴포넌트가 설치되어 있고, `SidebarProvider / Sidebar / SidebarInset / SidebarMenuButton` 조합을 직접 사용하는 것이 맞다는 점을 재확인했다.
- `frontend/app/globals.css`와 `frontend/tailwind.config.ts`에 `sidebar` 관련 semantic color가 정의돼 있지 않아, 그대로는 `bg-sidebar`, `text-sidebar-foreground` 같은 class가 의미를 가지지 못한다는 점을 확인했다.

### 2. 구현
- `frontend/app/globals.css`
  - 관리자 sidebar가 기존 브랜드 색조를 유지하면서도 shadcn semantic token을 쓸 수 있도록 `--sidebar-background`, `--sidebar-foreground`, `--sidebar-primary`, `--sidebar-accent`, `--sidebar-border`, `--sidebar-ring` 변수를 추가했다.
- `frontend/tailwind.config.ts`
  - `sidebar` color 그룹을 추가해 `bg-sidebar`, `text-sidebar-foreground`, `border-sidebar-border`, `ring-sidebar-ring` 등이 실제 유효한 Tailwind class가 되도록 연결했다.
- `frontend/components/admin/AdminSidebar.tsx`
  - 기존 custom `<aside>`와 수동 nav markup을 제거하고 `SidebarHeader`, `SidebarContent`, `SidebarGroup`, `SidebarMenu`, `SidebarMenuButton`, `SidebarFooter` 조합으로 재구성했다.
  - 기존 `ADMIN_MENU_ITEMS` 구조와 링크는 그대로 유지했다.
  - `getAdminSidebarItem()`를 추가해 현재 섹션명을 header/footer에서 재사용할 수 있게 했다.
  - 모바일에서는 `useSidebar().setOpenMobile(false)`를 호출해 메뉴 이동 직후 sheet가 닫히도록 만들었다.
- `frontend/components/admin/AdminShell.tsx`
  - 기존 수동 `Sheet` 기반 모바일 메뉴를 제거하고 `SidebarProvider + Sidebar + SidebarRail + SidebarInset + SidebarTrigger` 기반 구조로 변경했다.
  - header 상단에 `관리자 / 현재 섹션` 라벨을 추가해 현재 위치 표시를 명확히 했다.
  - 본문 페이지 내용은 건드리지 않고 shell 계층만 변경했다.
- `frontend/components/ui/sidebar.tsx`
  - mobile sidebar가 dialog 접근성 경고를 내지 않도록 `SheetTitle`, `SheetDescription`을 `sr-only`로 추가했다.
  - 빌드 검증 과정에서 `useIsMobile` import 경로가 잘못돼 있던 기존 통합 문제를 확인했고, `@/components/ui/use-mobile`로 바로잡았다. 이 수정은 shadcn sidebar를 실제로 쓰기 시작하면서 드러난 blocker를 해소하는 범위로 판단했다.

### 3. 범위 조정
- 관리자 개별 페이지의 카드, 표, 데이터 요청 로직은 변경하지 않았다.
- 브라우저 검증을 위해 인증 우회를 위한 로컬 스토리지 토큰만 임시로 주입했고, 실제 로그인 API나 백엔드 로직 수정은 수행하지 않았다.
- `npm run lint`는 이 worktree 환경에서 `eslint`가 설치되어 있지 않아 실행되지 못했고, 대신 `npm run build`와 Playwright 기반 수동 UI 검증으로 대체했다.

## 설계 결정 기록
### 결정 1. 작업 로그 파일명은 사용자 요청을 우선 적용
- 배경: 이슈 #31의 내용은 관리자 sidebar 작업이지만, 사용자 요청의 로그 파일명 slug는 `home-hero-hierarchy`였다.
- 선택: 파일명은 사용자 요청대로 유지하고, 로그 본문에서 실제 작업 범위를 명확히 기록한다.
- 이유: 사용자의 명시적 파일 경로 요구를 우선 만족하면서도 기록의 의미 왜곡은 본문 설명으로 보완할 수 있다.
- 대안: 이슈 제목과 맞는 slug로 새 파일명을 임의 변경하는 방법을 검토했다.
- 영향: 로그 파일명만 이슈 주제와 다르고, 실제 구현 기록과 브랜치/이슈 연결 정보는 본문에서 추적 가능하다.

### 결정 2. 관리자 shell은 shadcn sidebar 전체 구조로 올리고, 메뉴 데이터는 그대로 유지
- 배경: 이슈 요구사항은 관리자 내비게이션을 공용 sidebar 시스템 위로 옮기되 현재 메뉴 정보 구조를 유지하는 것이었다.
- 선택: 메뉴 item 배열은 유지하고, 이를 감싸는 shell 계층만 `SidebarProvider`, `Sidebar`, `SidebarInset`, `SidebarMenuButton` 조합으로 바꿨다.
- 이유: 가장 작은 변경으로 acceptance criteria를 만족하면서, 이후 관리자 페이지가 늘어나도 동일한 shell primitive를 재사용할 수 있다.
- 대안: 기존 custom sidebar 스타일만 손보고 모바일 sheet만 shadcn으로 바꾸는 방법을 검토했다.
- 영향: admin page 내용은 그대로 두고 shell 계층만 표준화되었다.

### 결정 3. sidebar 색상은 새 디자인을 만들지 않고 기존 브랜드 토큰에 매핑
- 배경: shadcn sidebar primitive는 `sidebar-*` semantic token을 전제로 하는데, 현재 프로젝트는 브랜드/중성 팔레트만 정의돼 있었다.
- 선택: 새로운 팔레트를 만들지 않고 기존 `brand-blue`, `neutral-slate`, `brand-indigo` 기반 값을 `sidebar-*` 변수로 매핑했다.
- 이유: 기존 관리자 톤을 유지하면서도 shadcn class를 semantic하게 사용할 수 있고, 색상 변경 지점도 전역 변수로 한정된다.
- 대안: 각 컴포넌트에 직접 `brand-*` class를 덧칠하는 방식, 혹은 완전히 다른 sidebar 전용 색상 체계를 추가하는 방식을 검토했다.
- 영향: sidebar primitive를 다른 화면에 확장할 때도 같은 semantic color를 사용할 수 있다.

### 결정 4. 모바일 dialog 접근성 경고는 공용 sidebar 컴포넌트에서 해소
- 배경: Playwright로 mobile sidebar를 열었을 때 `Dialog`에 `Description`이 없다는 Radix 경고가 실제로 발생했다.
- 선택: `frontend/components/ui/sidebar.tsx`의 mobile `SheetContent` 안에 `SheetTitle`과 `SheetDescription`을 `sr-only`로 넣었다.
- 이유: 관리자 셸에서만 우회 처리하면 같은 sidebar primitive를 쓰는 다른 화면에서 동일 경고가 재발할 수 있어, 공용 컴포넌트 차원에서 막는 편이 더 안전하다.
- 대안: 관리자 전용 sidebar 내부에서만 숨김 설명을 추가하거나 경고를 무시하는 방법을 검토했다.
- 영향: shadcn sidebar primitive를 mobile dialog로 여는 모든 사용처의 접근성 기본값이 좋아졌다.

### 결정 5. shadcn sidebar 통합을 막는 기존 import mismatch는 이번 작업에서 함께 수정
- 배경: `npm run build` 검증 중 `frontend/components/ui/sidebar.tsx`가 `@/hooks/use-mobile`에서 `useIsMobile`을 찾지 못해 경고를 내는 기존 통합 문제가 드러났다.
- 선택: import 경로를 실제 `useIsMobile` export가 있는 `@/components/ui/use-mobile`로 수정했다.
- 이유: 이 문제를 해결하지 않으면 이번 이슈의 핵심인 sidebar primitive 채택이 불완전한 상태로 남는다.
- 대안: 별도 후속 이슈로 미루거나, hooks 쪽에 alias export를 추가하는 방법을 검토했다.
- 영향: 현재 sidebar primitive가 빌드 가능한 상태가 되었고, 관리자 shell 변경을 실제로 검증할 수 있었다.

## 검증
- 실행한 테스트:
  - `npm run build` (`/Users/cycrpto/.codex/worktrees/issue-31/portfolio-blog/frontend`)
    - 성공
  - `npm run lint`
    - 실패: `eslint` 패키지 미설치로 실행 불가
- 수동 확인:
  - Playwright로 `http://127.0.0.1:3001/admin` 접속
  - 로컬 스토리지에 만료되지 않은 임시 JWT 형식 토큰을 주입해 admin layout 인증 가드를 통과
  - 데스크톱 뷰에서 sidebar, header, 현재 위치 라벨, 본문 계층이 함께 렌더링되는지 확인
  - 모바일 뷰에서 `SidebarTrigger` 클릭 시 `Sidebar navigation` dialog가 열리고 메뉴가 동일 구조로 표시되는지 확인
  - 모바일 메뉴에서 `행동 통계` 링크 클릭 시 `/admin/analytics`로 이동하면서 sheet가 닫히는지 확인
  - 접근성 경고 재검증: mobile sidebar dialog에 `Title`/`Description`이 존재해 warning이 사라진 것을 확인
- 확인하지 못한 항목:
  - 실제 백엔드 로그인 성공 후 end-to-end 인증 흐름
  - `http://localhost:3002` 미기동 상태라 통계 API 요청은 `ERR_CONNECTION_REFUSED`가 발생했고, 이는 shell 레이아웃 검증과는 분리해 판단했다.

## 남은 이슈 / 후속 작업
- `frontend` 패키지의 lint 스크립트는 현재 `eslint` devDependency 부재로 동작하지 않는다. 저장소 차원에서 lint 체계를 정리할 필요가 있다.
- backend가 없는 상태에서는 admin 통계/로그인 API까지 포함한 완전한 E2E 확인이 불가능하다.
- `Sidebar navigation`의 숨김 설명 문구는 일반적인 수준으로 넣었다. 추후 프로젝트 전체에서 sidebar primitive를 더 넓게 사용할 경우 문구를 더 일반화할지 검토할 수 있다.
