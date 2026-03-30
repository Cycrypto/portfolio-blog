# 작업 로그: 공개 이력서 웹 뷰어 추가

## 기본 정보
- 작성일: 2026-03-30
- GitHub Issue: #35
- 브랜치: `codex/public-resume-viewer`
- 작업자: Codex

## 작업 목표
- 기존 `/api/resume` PDF 다운로드 흐름은 유지하면서, 공개 URL `/resume`에서 브라우저 안에서 바로 읽을 수 있는 웹 이력서 경험을 추가한다.
- 홈, 플로팅 네비, 관리자 이력서 프리뷰 CTA를 다운로드 우선에서 웹 보기 우선으로 재정리한다.
- 범위 밖 항목으로는 PDF 자체 디자인 리워크와 관리자 화면 전면 개편을 포함하지 않는다.

## 작업 내역
### 1. 분석
- `frontend/app/api/resume/route.ts`를 확인해 현재 이력서 진입점이 PDF attachment 다운로드 하나뿐임을 확인했다.
- `frontend/components/admin/ResumePreviewButton.tsx`, `frontend/app/page.tsx`, `frontend/components/common/layout/floating-nav.tsx`를 확인해 주요 CTA가 모두 `/api/resume`를 직접 가리키고 있음을 확인했다.
- `frontend/lib/portfolio/build-resume-snapshot.ts`를 확인해 PDF 생성에 필요한 이력서 데이터 스냅샷을 이미 공용으로 구성할 수 있는 상태임을 확인했다.

### 2. 구현
- `frontend/app/resume/page.tsx`를 추가해 공개 `/resume` 웹 이력서 페이지를 구현했다.
- 페이지는 `buildResumeSnapshot()`을 그대로 사용해 이력서 설정, 대표 프로젝트, 경력 데이터를 조합하고, 상단에서 PDF 다운로드를 보조 액션으로 제공한다.
- 데스크톱에서는 본문과 요약 패널을 분리한 2열 구조로, 모바일에서는 한 컬럼으로 자연스럽게 내려오는 읽기 중심 레이아웃으로 구성했다.
- `frontend/app/page.tsx`의 홈 hero/contact CTA를 `/api/resume` 다운로드 우선에서 `/resume` 웹 보기 우선으로 바꾸고, PDF 다운로드는 보조 텍스트 액션으로 낮췄다.
- `frontend/components/common/layout/floating-nav.tsx`의 공개 이력서 진입점을 `/resume`으로 변경했다.
- `frontend/components/admin/ResumePreviewButton.tsx`의 관리자 프리뷰 버튼을 `/resume` 웹 미리보기로 변경했다.
- `frontend/app/sitemap.ts`에 `/resume`을 추가해 공개 라우트를 사이트맵에 반영했다.

### 3. 범위 조정
- PDF 생성 로직과 시각 디자인은 그대로 유지했다.
- 관리자 화면에서는 프리뷰 버튼의 목적지만 바꾸고, 추가 다운로드 버튼이나 편집 UI 확장은 하지 않았다.

## 설계 결정 기록
### 결정 1. 이력서 데이터는 기존 스냅샷 로직을 재사용한다
- 배경: 웹 뷰와 PDF가 서로 다른 데이터 조합을 사용하면 내용 불일치가 쉽게 발생한다.
- 선택: `buildResumeSnapshot()`을 공개 웹 뷰와 PDF 다운로드가 함께 사용하는 단일 데이터 소스로 유지한다.
- 이유: 새 데이터 계층을 추가하지 않고도 공개 뷰와 PDF 결과를 정합성 있게 맞출 수 있다.
- 대안: `/resume` 전용 API 또는 별도 직렬화 계층을 추가하는 방법을 검토할 수 있으나, 현재 이슈 범위에는 과하다.
- 영향: 이번 작업은 주로 `frontend/app`과 관련 컴포넌트의 뷰 구성 및 CTA 재배치에 집중할 수 있다.

### 결정 2. 공개 이력서는 PDF 임베드가 아니라 HTML 뷰로 제공한다
- 배경: 이슈의 핵심은 브라우저 안에서 바로 읽히는 경험이며, 모바일에서 PDF 임베드는 확대/축소와 가로 스크롤 문맥이 쉽게 깨진다.
- 선택: `/resume`은 PDF 뷰어가 아니라 HTML 이력서 페이지로 구현하고, PDF는 다운로드 액션으로 유지했다.
- 이유: 동일한 데이터라도 HTML이 모바일 대응, 텍스트 스캔, SEO, CTA 배치 측면에서 훨씬 유리하다.
- 대안: `/api/resume`를 iframe/object로 감싸는 방식은 구현은 빠르지만 읽기 경험이 떨어지고, 이슈가 요구한 “웹 보기 중심”과도 맞지 않는다.
- 영향: 공개 URL은 문서형 페이지가 되었고, PDF는 제출/보관용 보조 경로로 역할이 정리됐다.

### 결정 3. 주요 CTA는 웹 보기 우선, PDF는 보조 액션으로 재배치한다
- 배경: 기존 홈/플로팅 네비/관리자 프리뷰 모두가 다운로드 경로를 직접 가리켜 사용자가 바로 열람하기 어려웠다.
- 선택: 주요 CTA 대상은 `/resume`으로 통일하고, 다운로드는 홈 텍스트 링크와 `/resume` 내부 버튼으로 유지했다.
- 이유: 사용자의 첫 진입점은 읽기 경험이어야 하고, PDF는 필요한 경우에만 선택되도록 하는 편이 이슈 의도에 맞다.
- 대안: 모든 위치에 웹 보기와 다운로드를 병렬 노출하는 방법도 가능하지만, 주요 CTA의 우선순위가 다시 흐려질 수 있어 채택하지 않았다.
- 영향: 링크 구조가 단순해졌고, 공개 이력서 페이지가 이력서 경험의 중심 진입점이 되었다.

## 검증
- 실행한 테스트:
  - `frontend/`에서 `npm run build`
- 수동 확인:
  - `curl -I http://127.0.0.1:3006/resume`로 `/resume`이 `200 text/html`로 응답하는지 확인
  - `curl -I http://127.0.0.1:3006/api/resume`로 기존 PDF 다운로드가 `200 application/pdf` + `content-disposition: attachment`를 유지하는지 확인
  - headless Chrome으로 `/resume` 데스크톱/모바일 스크린샷을 생성해 읽기 레이아웃을 확인
  - 홈 화면 상단 스크린샷과 HTML 덤프에서 `이력서 보기 -> /resume`, 보조 `PDF 다운로드 -> /api/resume` 구조를 확인
- 확인하지 못한 항목:
  - 인증이 필요한 관리자 화면 내부에서 클릭 플로우 전체를 브라우저로 직접 확인하지는 못했다.
  - 로컬 백엔드/API가 연결되지 않은 상태라 실제 저장된 이력서 데이터로는 검증하지 못했고, fallback 데이터 기준으로만 렌더링을 확인했다.

## 남은 이슈 / 후속 작업
- 실제 운영 데이터가 연결된 환경에서 경력/프로젝트가 긴 경우 세로 길이와 줄바꿈 밀도를 한 번 더 확인할 필요가 있다.
- 현재 홈 CTA 이벤트 식별값은 `resume_view`로 변경했으므로, 분석 대시보드에서 기존 `resume` 이벤트와 함께 보는 방식이 맞는지 후속 점검이 필요하다.
