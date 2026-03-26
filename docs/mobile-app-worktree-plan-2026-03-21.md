# 모바일앱 친화성 개선 작업단위 정의서

작성일: 2026-03-21

참조 점검 문서:

- `/Users/cycrpto/Desktop/my-blog/docs/mobile-app-friendliness-audit-2026-03-21.md`

## 목적

모바일앱 친화성 개선 작업을 "하나의 오케스트레이션 에이전트가 여러 서브에이전트를 호출해 처리할 수 있는 worktree 단위"로 재구성한다.

이번 문서의 핵심 조건은 두 가지다.

- 각 작업단위는 독립 worktree 로 분리 가능해야 한다.
- 각 작업단위의 쓰기 범위는 서로 중복되지 않아야 한다.

## 분할 원칙

- 한 작업단위 = 한 worktree = 한 오케스트레이션 에이전트
- 오케스트레이터는 구현과 통합을 책임지고, 서브에이전트는 탐색/디자인/검증을 병렬로 지원한다.
- 쓰기 범위가 겹치는 파일은 다른 작업단위에 넣지 않는다.
- 공통 참조는 허용하지만, 공통 수정은 금지한다.
- 각 worktree 는 자체 검증 산출물을 남긴다.

## 권장 실행 순서

1. `WU-01` 홈 피드 데이터 계약 복구
2. `WU-02` 모바일 셸/PWA 기반 정비
3. `WU-05` 모바일 breakpoint 단일화
4. `WU-03` 터치 타깃/입력 조작성 개선
5. `WU-04` 홈 정보 밀도/모바일 흐름 재구성

병렬 가능 조합:

- `WU-02` 와 `WU-05`
- `WU-03` 는 `WU-02` 완료 후 시작 권장
- `WU-04` 는 `WU-01` 완료 후 시작 권장

## 작업단위 목록

### WU-01 홈 피드 데이터 계약 복구

- 권장 worktree 이름: `codex/mobile-home-feed-contract`
- 목적:
  홈의 "최신 글" 섹션과 글 개수 메트릭이 실제 데이터와 일치하도록 복구한다.
- 오케스트레이터:
  `nextjs_frontend`
- 추천 서브에이전트:
  `code_mapper`, `reviewer`
- 쓰기 범위:
  - `/Users/cycrpto/Desktop/my-blog/frontend/lib/api/services/posts.ts`
  - `/Users/cycrpto/Desktop/my-blog/frontend/lib/portfolio/build-portfolio-snapshot.ts`
  - 필요 시 이 단위가 추가하는 테스트 파일
- 읽기 범위:
  - 홈 페이지와 블로그 페이지 전체
  - 백엔드 posts 응답 컨트롤러
- 제외 파일:
  - `frontend/app/layout.tsx`
  - `frontend/components/common/layout/floating-nav.tsx`
  - `frontend/components/ui/button.tsx`
  - `frontend/app/page.tsx`
- 이 단위에서 해결할 문제:
  - 홈에서 최신 글이 비어 보이는 문제
  - 홈 "기술 글" 개수 메트릭이 0으로 표시되는 문제
  - 블로그 목록과 홈 스냅샷의 posts 파싱 경로 불일치
- 완료 조건:
  - 홈에서 최신 글 카드가 실제 포스트로 노출된다.
  - 홈 메트릭의 "기술 글" 수가 목록 API 응답과 일치한다.
  - mock API와 실제 API 구조 차이를 코드 수준에서 설명 가능하다.
  - 최소 1개의 회귀 방지 검증이 추가된다.

### WU-02 모바일 셸/PWA 기반 정비

- 권장 worktree 이름: `codex/mobile-shell-foundation`
- 목적:
  설치 가능성, safe-area, 상단 셸 안정성을 먼저 확보해 "모바일 웹"에서 "앱 친화적 웹"으로 올린다.
- 오케스트레이터:
  `nextjs_frontend`
- 추천 서브에이전트:
  `ui_designer`, `browser_debugger`, `reviewer`
- 쓰기 범위:
  - `/Users/cycrpto/Desktop/my-blog/frontend/app/layout.tsx`
  - `/Users/cycrpto/Desktop/my-blog/frontend/components/common/layout/floating-nav.tsx`
  - `/Users/cycrpto/Desktop/my-blog/frontend/public/*`
  - 새로 추가하는 `manifest` 또는 PWA 관련 파일
- 읽기 범위:
  - 홈/프로젝트/블로그/관리자 로그인
  - safe-area 관련 CSS 필요 여부
- 제외 파일:
  - `frontend/components/ui/button.tsx`
  - `frontend/components/ui/input.tsx`
  - `frontend/components/ui/textarea.tsx`
  - `frontend/app/page.tsx`
  - `frontend/hooks/use-mobile.tsx`
  - `frontend/components/ui/use-mobile.tsx`
- 이 단위에서 해결할 문제:
  - `manifest`, 앱 아이콘, `themeColor`, Apple web app 메타 부재
  - top-right toaster 와 상단 floating nav 의 safe-area 미대응
  - 스크롤 후 나타나는 모바일 상단 셸의 앱형 안정성 부족
  - 모바일 햄버거 메뉴의 구조적 셸 polish 부족
- 완료 조건:
  - manifest 와 앱 아이콘이 실제로 노출된다.
  - 상단 셸이 notch/safe-area 환경에서도 겹치지 않는다.
  - toaster 와 floating nav 의 상단 충돌 위험이 제거된다.
  - 모바일 메뉴 열림/닫힘 상태가 브라우저 캡처로 재검증된다.

### WU-03 터치 타깃/입력 조작성 개선

- 권장 worktree 이름: `codex/mobile-touch-targets`
- 목적:
  모바일 앱 기준으로 너무 작은 버튼, 링크, 입력 높이를 넓혀 실제 사용성을 높인다.
- 오케스트레이터:
  `nextjs_frontend`
- 추천 서브에이전트:
  `ui_designer`, `browser_debugger`, `reviewer`
- 쓰기 범위:
  - `/Users/cycrpto/Desktop/my-blog/frontend/components/ui/button.tsx`
  - `/Users/cycrpto/Desktop/my-blog/frontend/components/ui/input.tsx`
  - `/Users/cycrpto/Desktop/my-blog/frontend/components/ui/textarea.tsx`
  - `/Users/cycrpto/Desktop/my-blog/frontend/components/common/pagination.tsx`
  - `/Users/cycrpto/Desktop/my-blog/frontend/components/common/advanced-search.tsx`
  - `/Users/cycrpto/Desktop/my-blog/frontend/components/blog/blog-filter.tsx`
  - `/Users/cycrpto/Desktop/my-blog/frontend/components/blog/blog-card.tsx`
  - `/Users/cycrpto/Desktop/my-blog/frontend/components/project/project-list.tsx`
  - `/Users/cycrpto/Desktop/my-blog/frontend/app/admin/login/page.tsx`
- 읽기 범위:
  - 블로그/프로젝트/로그인 모바일 스크린샷
- 제외 파일:
  - `frontend/components/common/layout/floating-nav.tsx`
  - `frontend/app/layout.tsx`
  - `frontend/app/page.tsx`
  - `frontend/hooks/use-mobile.tsx`
  - `frontend/components/ui/use-mobile.tsx`
- 이 단위에서 해결할 문제:
  - 기본 버튼 높이 `40px`, small 버튼 `36px`
  - 블로그 필터, 페이지네이션, `글 보기`, `코드`, `서비스` 등의 작은 hit area
  - 로그인 입력/버튼의 앱 기준 이하 높이
  - 검색창 내부 clear 버튼 등 세부 탭 타깃 밀도 문제
- 완료 조건:
  - 주요 모바일 인터랙션 요소가 기본적으로 `44px` 기준을 만족한다.
  - Playwright 모바일 점검에서 작은 타깃 개수가 의미 있게 줄어든다.
  - 블로그/프로젝트/로그인에서 손가락 탭 기준의 조작성 회귀가 없다.

### WU-04 홈 정보 밀도/모바일 흐름 재구성

- 권장 worktree 이름: `codex/mobile-home-density`
- 목적:
  홈을 긴 랜딩 페이지에서 "모바일에서 빠르게 훑고 이동하는 탐색 화면"에 더 가깝게 조정한다.
- 오케스트레이터:
  `nextjs_frontend`
- 추천 서브에이전트:
  `product_manager`, `ui_designer`, `browser_debugger`
- 쓰기 범위:
  - `/Users/cycrpto/Desktop/my-blog/frontend/app/page.tsx`
  - `/Users/cycrpto/Desktop/my-blog/frontend/components/common/section-heading.tsx`
  - `/Users/cycrpto/Desktop/my-blog/frontend/components/home/timeline.tsx`
  - `/Users/cycrpto/Desktop/my-blog/frontend/components/common/contact-form.tsx`
- 읽기 범위:
  - 홈 관련 점검 스크린샷
  - 프로젝트/블로그 카드 컴포넌트는 읽기만 가능
- 제외 파일:
  - `frontend/app/layout.tsx`
  - `frontend/components/common/layout/floating-nav.tsx`
  - `frontend/components/ui/button.tsx`
  - `frontend/components/project/project-list.tsx`
  - `frontend/components/blog/blog-card.tsx`
  - `frontend/app/globals.css`
- 이 단위에서 해결할 문제:
  - 모바일에서 첫 화면 이후의 세로 공백이 큰 문제
  - 섹션 간 탐색 가치가 늦게 드러나는 문제
  - 경험/프로젝트/연락 섹션이 앱형 정보 흐름보다 랜딩형 구성에 가까운 문제
  - 홈에서 "빠르게 스캔" 하는 경로가 약한 문제
- 완료 조건:
  - 첫 두 번의 스크롤 안에 핵심 가치와 다음 행동이 더 많이 노출된다.
  - 홈의 스크롤 체감 길이가 줄어든다.
  - 프로젝트/블로그/문의 섹션으로 내려가는 흐름이 더 조밀해진다.
  - 2차 모바일 캡처 기준으로 홈의 정보 밀도 개선이 눈에 띈다.

### WU-05 모바일 breakpoint 단일화

- 권장 worktree 이름: `codex/mobile-breakpoint-unification`
- 목적:
  모바일 판별 로직을 하나의 기준으로 묶어 내비게이션, 에디터, 보조 컴포넌트의 동작 차이를 줄인다.
- 오케스트레이터:
  `nextjs_frontend`
- 추천 서브에이전트:
  `code_mapper`, `reviewer`
- 쓰기 범위:
  - `/Users/cycrpto/Desktop/my-blog/frontend/hooks/use-mobile.tsx`
  - `/Users/cycrpto/Desktop/my-blog/frontend/components/ui/use-mobile.tsx`
  - 새로 추가하는 shared breakpoint 상수/유틸 파일
- 읽기 범위:
  - `useMobile`, `useIsMobile` 소비처 전반
- 제외 파일:
  - `frontend/components/common/layout/floating-nav.tsx`
  - `frontend/components/editor/*`
  - `frontend/components/admin/*`
- 이 단위에서 해결할 문제:
  - 동일한 `768px` 기준을 중복 구현하는 구조
  - 훅 구현 차이에서 생길 수 있는 mobile 상태 불일치
  - 추후 breakpoint 변경 시 중복 수정 리스크
- 완료 조건:
  - breakpoint 기준이 하나의 소스에 모인다.
  - 기존 소비처 import 는 최대한 덜 흔든다.
  - hooks 간 의미 차이가 문서나 코드에서 명확히 제거된다.

## 중복 방지 체크

- `frontend/app/layout.tsx` 는 `WU-02` 전용
- `frontend/components/common/layout/floating-nav.tsx` 는 `WU-02` 전용
- `frontend/components/ui/button.tsx` 는 `WU-03` 전용
- `frontend/components/ui/input.tsx` 는 `WU-03` 전용
- `frontend/components/ui/textarea.tsx` 는 `WU-03` 전용
- `frontend/app/page.tsx` 는 `WU-04` 전용
- `frontend/hooks/use-mobile.tsx` 는 `WU-05` 전용
- `frontend/components/ui/use-mobile.tsx` 는 `WU-05` 전용
- `frontend/lib/api/services/posts.ts` 는 `WU-01` 전용
- `frontend/lib/portfolio/build-portfolio-snapshot.ts` 는 `WU-01` 전용

## 권장 오케스트레이션 패턴

각 worktree 에서 아래 패턴을 기본으로 쓴다.

- 구현 중심 worktree:
  오케스트레이터 `nextjs_frontend`
  서브에이전트 `code_mapper` 또는 `ui_designer`
  검증 `browser_debugger`
  최종 점검 `reviewer`

- 데이터 계약/구조 worktree:
  오케스트레이터 `nextjs_frontend`
  서브에이전트 `code_mapper`
  최종 점검 `reviewer`

- 흐름/정보 구조 worktree:
  오케스트레이터 `nextjs_frontend`
  서브에이전트 `product_manager`, `ui_designer`, `browser_debugger`

## 최종 메모

가장 먼저 착수할 worktree 는 `WU-01` 이다.

이유:

- 홈 최신 글 영역이 비어 있으면 모바일 개선 전후 비교가 왜곡된다.
- 홈 탐색 흐름에서 실제 콘텐츠가 빠져 있으면 이후의 정보 밀도 조정도 정확히 판단할 수 없다.

그 다음 우선순위는 `WU-02` 와 `WU-03` 이다.

- `WU-02` 는 앱 친화성의 기반
- `WU-03` 는 실제 손가락 사용성을 바로 바꾸는 단위

즉, 추천 묶음은 아래와 같다.

1. `WU-01`
2. `WU-02` + `WU-05`
3. `WU-03`
4. `WU-04`
