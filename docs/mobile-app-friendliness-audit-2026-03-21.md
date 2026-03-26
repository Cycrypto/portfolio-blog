# 모바일앱 친화성 점검 보고서

작성일: 2026-03-21

## 목적

현재 포트폴리오/블로그 프론트엔드가 모바일 브라우저에서 얼마나 안정적으로 동작하는지 확인하고, 단순 반응형을 넘어 "앱 친화적" 경험으로 가기 위해 필요한 개선 우선순위를 정리한다.

이번 점검은 두 단계로 진행했다.

1. 실제 현재 상태 점검
2. 목업 API를 통한 2차 점검

## 점검 범위

- 공개 홈 `/`
- 프로젝트 목록 `/projects`
- 블로그 목록 `/blog`
- 관리자 로그인 `/admin/login`

## 실행 산출물

- 1차 점검 스크린샷: `/Users/cycrpto/Desktop/my-blog/output/playwright/mobile-audit`
- 2차 점검 스크린샷/리포트: `/Users/cycrpto/Desktop/my-blog/output/mobile-app-friendliness-audit/mock-round-2`
- 2차 점검 mock API 서버: `/Users/cycrpto/Desktop/my-blog/scripts/mobile_mock_api_server.mjs`
- 2차 점검 Playwright 스크립트: `/Users/cycrpto/Desktop/my-blog/scripts/mobile_app_friendliness_audit_mock.mjs`

## 수행 방법

### 1차 점검

- 실제 현재 코드 상태를 모바일 viewport로 확인했다.
- 당시 백엔드 API가 떠 있지 않아 홈, 프로젝트, 블로그 일부는 빈 상태 또는 에러 상태로 관찰됐다.
- 이 단계에서는 "레이아웃/앱 셸/메타 구조"를 주로 확인했다.

### 2차 점검

- `/profile`, `/projects`, `/posts`, `/experiences`, `/tags/top` 을 제공하는 mock API 서버를 `127.0.0.1:3002` 에 띄웠다.
- 프론트엔드를 `127.0.0.1:3000` 에서 실행하고, `iPhone 13` 에뮬레이션으로 Playwright 모바일 점검을 수행했다.
- 스크린샷과 함께 아래 메트릭을 수집했다.
  - 가로 오버플로우 여부
  - fixed/sticky 요소 수
  - visible interactive 요소 수
  - 44px 미만 터치 타깃 후보
  - console error 수

## 요약 결론

- 현재 상태는 "모바일 대응 웹"으로는 나쁘지 않다.
- 하지만 "앱 친화성" 관점에서는 PWA 계층, safe-area 대응, 터치 타깃 크기, 고정 네비게이션 구조가 부족하다.
- 2차 점검에서 mock 데이터를 넣어도 홈의 최신 글 영역은 비어 있었다. 이건 콘텐츠 부재가 아니라 프론트엔드 데이터 파싱 버그로 보인다.
- 가로 오버플로우는 2차 점검 전 시나리오에서 재현되지 않았다.
- console error도 2차 점검에서는 0건이었다.
- 즉, 지금의 핵심 문제는 "깨짐"보다는 "앱처럼 쓰기 불편한 구조"와 "일부 실제 데이터 표시 결함"에 가깝다.

## 1차 점검 결과

### 확인된 장점

- 모바일 분기 자체는 이미 일부 들어가 있다.
- 홈 고정 내비게이션, 관리자 `Sheet`, 에디터 모바일 오버플로우 액션, `100dvh` 대응이 존재한다.
- 반응형 레이아웃 자체는 대체로 안정적이다.

### 확인된 구조적 한계

- 앱 설치 가능성 계층이 없다.
  - `manifest`, 앱 아이콘, service worker, Apple web app 메타가 없다.
  - 참고: `/Users/cycrpto/Desktop/my-blog/frontend/app/layout.tsx`
  - 참고: `/Users/cycrpto/Desktop/my-blog/frontend/public`
- safe-area 대응이 없다.
  - 상단 fixed 내비게이션과 toaster가 notch 영역을 고려하지 않는다.
  - 참고: `/Users/cycrpto/Desktop/my-blog/frontend/app/layout.tsx:54`
  - 참고: `/Users/cycrpto/Desktop/my-blog/frontend/components/common/layout/floating-nav.tsx:69`
- 터치 타깃 기본값이 앱 기준보다 작다.
  - 버튼 기본 높이 `40px`, small `36px`, 일부 메뉴 버튼 `32px`
  - 참고: `/Users/cycrpto/Desktop/my-blog/frontend/components/ui/button.tsx:23`
  - 참고: `/Users/cycrpto/Desktop/my-blog/frontend/components/common/layout/floating-nav.tsx:83`
- 모바일 상태 훅이 중복되어 있다.
  - 참고: `/Users/cycrpto/Desktop/my-blog/frontend/hooks/use-mobile.tsx:5`
  - 참고: `/Users/cycrpto/Desktop/my-blog/frontend/components/ui/use-mobile.tsx:5`

## 2차 점검 결과

### 메트릭 요약

`report.json` 기준:

- `home-top`: overflow=false, small=20, interactive=41, sticky=1, errors=0
- `home-projects`: overflow=false, small=20, interactive=41, sticky=1, errors=0
- `home-contact`: overflow=false, small=20, interactive=41, sticky=1, errors=0
- `home-menu-open`: overflow=false, small=20, interactive=47, sticky=1, errors=0
- `projects-full`: overflow=false, small=13, interactive=21, sticky=1, errors=0
- `blog-full`: overflow=false, small=20, interactive=22, sticky=1, errors=0
- `blog-tag-filter`: overflow=false, small=20, interactive=22, sticky=1, errors=0
- `admin-login`: overflow=false, small=3, interactive=3, sticky=0, errors=0

주의:

- `small` 은 리포트가 최대 20개까지만 잘라서 기록한 값이다.
- 즉 홈과 블로그는 "최소 20개 이상의 작은 터치 타깃 후보"가 있다는 뜻으로 읽는 게 맞다.

### 홈 `/`

관찰 요약:

- 첫 화면은 시각적으로 안정적이고 가로 깨짐은 없다.
- 히어로 자체는 읽기 쉽지만, 앱처럼 빠르게 탐색하는 화면이라기보다 긴 랜딩 페이지 성격이 강하다.
- 프로젝트와 연락 섹션으로 내려가면 상단 floating nav가 컨텐츠 위를 덮는 장면이 보인다.
- 햄버거 메뉴는 동작하지만 메뉴 버튼이 `32px`, 메뉴 항목은 `36px` 수준이라 모바일 앱 기준으로는 작다.
- 소셜 아이콘, 주요 CTA, 로그인/문의 입력도 대부분 `40px` 전후다.

구체 근거:

- 상단 fixed nav: `/Users/cycrpto/Desktop/my-blog/frontend/components/common/layout/floating-nav.tsx:69`
- 모바일 메뉴 버튼: `/Users/cycrpto/Desktop/my-blog/frontend/components/common/layout/floating-nav.tsx:83`
- 공통 버튼 높이: `/Users/cycrpto/Desktop/my-blog/frontend/components/ui/button.tsx:23`
- 공통 인풋 높이: `/Users/cycrpto/Desktop/my-blog/frontend/components/ui/input.tsx:11`
- 공통 섹션 간격: `/Users/cycrpto/Desktop/my-blog/frontend/app/globals.css:101`

스크린샷:

- `home-top.png`
- `home-projects.png`
- `home-contact.png`
- `home-menu-open.png`

### 프로젝트 `/projects`

관찰 요약:

- 단일 컬럼 목록으로 잘 떨어지고 가로 오버플로우도 없었다.
- 제목, 연결 글, 스택 정보는 모바일에서도 읽을 수 있다.
- 반면 `코드`, `서비스` 링크는 높이 `20px` 수준으로 매우 작다.
- 링크된 포스트 행도 세로 밀도는 괜찮지만 탭 타깃 여유가 부족하다.
- 읽히는 화면이긴 하지만 앱형 브라우징보다는 문서 목록형 웹 페이지에 가깝다.

스크린샷:

- `projects-full.png`

### 블로그 `/blog`

관찰 요약:

- mock 데이터 기준 카드와 태그 필터는 정상적으로 노출됐다.
- 검색창, 필터, 카드 구성이 모바일에서도 크게 깨지지 않았다.
- 다만 태그 필터 버튼은 `36px`, 검색창과 CTA는 `40px`, `글 보기` 링크는 `20px` 수준이라 앱 기준 터치 밀도가 부족하다.
- 카드 자체는 보기 좋지만, 글 카드 하단 CTA가 텍스트 링크형이라 탭하기엔 작다.
- 페이지네이션 버튼도 `40px` 수준이다.

스크린샷:

- `blog-full.png`
- `blog-tag-filter.png`

### 관리자 로그인 `/admin/login`

관찰 요약:

- 레이아웃은 안정적이고 입력 흐름도 단순하다.
- 하지만 입력과 로그인 버튼 높이가 모두 `40px` 라서 모바일 앱 친화 기준에서는 작다.
- 구조는 단정하지만 "터치 여유"는 부족하다.

스크린샷:

- `admin-login.png`

## 점검 중 발견한 기능 결함

### 홈의 최신 글 영역이 mock 데이터에서도 비어 있음

2차 점검에서 `/blog` 페이지는 mock 포스트를 정상적으로 렌더링했지만, 홈은 여전히:

- "기술 글 0개"
- "새 글을 준비 중입니다."

상태로 남아 있었다.

이건 mock 데이터 부족이 아니라 홈의 서버 사이드 포스트 로딩 경로 문제로 보인다.

관련 코드:

- 홈 스냅샷에서 `getPosts()` 결과를 그대로 사용: `/Users/cycrpto/Desktop/my-blog/frontend/lib/portfolio/build-portfolio-snapshot.ts:93`
- `getPosts()` 가 `PostListPayload` 를 `unwrapApiResponseData()` 로 언랩한 뒤 `payload.data`, `payload.totalCount` 를 기대함: `/Users/cycrpto/Desktop/my-blog/frontend/lib/api/services/posts.ts:24`

의심 원인:

- 블로그 목록 페이지는 직접 `fetch()` 후 `result.data.data` 구조를 읽는다.
- 반면 홈은 공용 `getPosts()` 를 사용하는데, 여기서는 리스트 payload 래핑 구조와 `unwrapApiResponseData()` 가 맞지 않아 최종적으로 포스트 배열/총개수를 잃어버릴 가능성이 높다.

영향:

- 홈의 "최신 글" 섹션이 실제 운영 데이터가 있어도 비어 보일 수 있다.
- 모바일앱 친화성 이전에 홈 탐색 구조 자체가 약해진다.

## 앱 친화성 관점의 핵심 문제

### 1. PWA 계층 부재

현재 메타데이터에는 `viewport` 기본값 외에 앱 친화 메타가 없다.

- `themeColor`
- `appleWebApp`
- manifest
- 앱 아이콘
- service worker

관련 코드:

- `/Users/cycrpto/Desktop/my-blog/frontend/app/layout.tsx:9`

### 2. safe-area 미대응

상단 floating nav와 toast는 notch/safe-area를 고려하지 않는다.

- floating nav: `/Users/cycrpto/Desktop/my-blog/frontend/components/common/layout/floating-nav.tsx:69`
- toaster: `/Users/cycrpto/Desktop/my-blog/frontend/app/layout.tsx:54`

### 3. 터치 타깃이 작음

공통 컴포넌트 기준으로 모바일 앱 친화 최소선인 `44px` 에 못 미치는 곳이 많다.

- default button `40px`: `/Users/cycrpto/Desktop/my-blog/frontend/components/ui/button.tsx:23`
- small button `36px`: `/Users/cycrpto/Desktop/my-blog/frontend/components/ui/button.tsx:24`
- input `40px`: `/Users/cycrpto/Desktop/my-blog/frontend/components/ui/input.tsx:11`
- 일부 메뉴 버튼 `32px`: `/Users/cycrpto/Desktop/my-blog/frontend/components/common/layout/floating-nav.tsx:86`

### 4. 랜딩 페이지식 세로 간격

모바일 앱처럼 빠른 탐색보다 긴 마케팅 랜딩 페이지 느낌이 강하다.

- 섹션 간격이 큼: `/Users/cycrpto/Desktop/my-blog/frontend/app/globals.css:101`

### 5. 모바일 상태 판별 중복

- `/Users/cycrpto/Desktop/my-blog/frontend/hooks/use-mobile.tsx:5`
- `/Users/cycrpto/Desktop/my-blog/frontend/components/ui/use-mobile.tsx:5`

한 화면에서 내비게이션, 에디터, 보조 컴포넌트가 서로 다른 시점에 mobile 상태를 계산할 위험이 있다.

## 우선순위 제안

### P0

- 홈 최신 글 로딩 경로 수정
- mock이 아니라 실제 데이터로 2차 모바일 점검 재실행

### P1

- `manifest`, 앱 아이콘, `themeColor`, `appleWebApp` 메타 추가
- safe-area inset 대응
- 상단 floating nav 구조 단순화
- 모바일 주요 CTA, 입력, 메뉴를 최소 `44px` 기준으로 상향

### P2

- 홈 섹션 간격과 정보 밀도 재조정
- 프로젝트/블로그 카드의 텍스트 링크형 CTA를 버튼형 또는 넓은 hit area로 변경
- 블로그 태그 필터와 페이지네이션 hit area 확장

### P3

- `useMobile` 훅 단일화
- 앱 셸형 하단 탐색 또는 더 명확한 모바일 탐색 구조 검토
- standalone/display-mode 환경 전용 polish 추가

## 재현 방법

### 1. mock API 서버 실행

```bash
node scripts/mobile_mock_api_server.mjs
```

### 2. 프론트엔드 실행

```bash
npm run dev --prefix frontend -- --hostname 127.0.0.1 --port 3000
```

### 3. 2차 모바일 점검 실행

```bash
npx --yes -p playwright node scripts/mobile_app_friendliness_audit_mock.mjs
```

### 4. 결과 확인

- `/Users/cycrpto/Desktop/my-blog/output/mobile-app-friendliness-audit/mock-round-2/report.json`
- 같은 디렉터리의 PNG 스크린샷

## 최종 판단

현재 구현은 모바일에서 "깨지지 않는 포트폴리오 웹"에는 가깝다.
하지만 "모바일 앱처럼 빠르고 안정적으로 쓰는 경험"까지는 아직 거리가 있다.

가장 먼저 해결할 것은 아래 세 가지다.

1. 홈 최신 글 표시 버그 수정
2. touch target/safe-area 개선
3. PWA/app-shell 계층 추가

이 세 축을 먼저 잡아야 이후의 세부 UI polish가 실제 체감 개선으로 이어진다.
