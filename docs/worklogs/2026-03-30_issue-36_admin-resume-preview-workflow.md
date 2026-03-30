# 작업 로그: 관리자 이력서 프리뷰 워크플로우 개선

## 기본 정보
- 작성일: 2026-03-30
- GitHub Issue: #36
- 브랜치: `codex/admin-resume-preview-workflow`
- 작업자: Codex

## 작업 목표
- 관리자 이력서 설정 화면에서 preview, web view, download 액션의 역할을 분리하고 수정 직후 결과를 더 빠르게 확인할 수 있는 프리뷰 중심 워크플로우를 만든다.
- resume 관련 관리자 화면 전반에서 프리뷰 진입 방식과 CTA 우선순위를 일관되게 정리한다.
- 범위 밖 항목은 PDF 내부 레이아웃 전면 개편, 공개 `/resume` 페이지의 대규모 디자인 변경, 데이터 모델 변경이다.

## 작업 내역
### 1. 분석
- GitHub issue #36의 `Summary`, `Scope`, `Out of Scope`, `Acceptance Criteria`를 확인했다.
- `Suggested Branch`인 `codex/admin-resume-preview-workflow`를 사용해 전용 git worktree를 생성했다.
- 구현 전 `Work Status`를 `진행 중`으로 업데이트했다.
- 다음 파일을 우선 분석 대상으로 확정했다.
  - `frontend/app/admin/resume/page.tsx`
  - `frontend/components/admin/ResumeSettingsEditor.tsx`
  - `frontend/components/admin/ResumePreviewButton.tsx`
  - `frontend/app/admin/projects/new/page.tsx`
  - `frontend/app/admin/projects/[id]/edit/page.tsx`
  - `frontend/app/admin/experience/page.tsx`
- 기존 공통 진입점인 `ResumePreviewButton`이 사실상 `/api/resume` PDF 새 탭 링크 하나만 제공하고 있어 `preview / web view / download`가 역할 분리되지 않았음을 확인했다.
- 공개 `/resume` 페이지는 존재하지 않았고, 현재 공개/관리자 양쪽 모두가 `/api/resume`를 직접 여는 구조라 HTML 기반 빠른 확인 경로가 없었다.

### 2. 구현
- `frontend/components/admin/ResumePreviewButton.tsx`를 확장해 공통 이력서 액션 컴포넌트로 재구성했다.
  - 기본 CTA는 admin 안에서 바로 여는 `빠른 프리뷰` 시트로 변경했다.
  - 보조 액션 메뉴에서 `웹 보기`(`/resume`)와 `PDF 다운로드`(`/api/resume`)를 분리했다.
  - 저장 성공 시 프리뷰가 갱신될 수 있도록 custom event 기반 refresh 연결을 추가했다.
- `frontend/app/resume/page.tsx`, `frontend/components/resume/ResumeWebView.tsx`, `frontend/lib/resume/preview-events.ts`를 추가했다.
  - `buildResumeSnapshot()`을 재사용해 HTML 기반 resume web view를 새로 만들었다.
  - preview 모드에서는 admin 시트 안에서 군더더기 없이 확인할 수 있도록 상단 안내를 제외한 레이아웃을 사용했다.
  - web view에서는 `PDF 다운로드` CTA를 별도로 노출해 역할을 분리했다.
- `frontend/components/admin/ResumeSettingsEditor.tsx`에서 프리뷰 워크플로우 카드를 추가하고 저장 CTA 근처 문구를 정리했다.
  - 저장 -> 빠른 프리뷰 -> 최종 확인 흐름을 우측 컬럼에 명시했다.
  - 중복이던 section 내부 preview 버튼은 제거하고, 저장 후 프리뷰 확인 안내를 남겼다.
- `frontend/app/admin/resume/page.tsx` 설명 문구를 현재 워크플로우에 맞게 바꿨다.
- `frontend/app/admin/projects/new/page.tsx`, `frontend/app/admin/projects/[id]/edit/page.tsx`, `frontend/app/admin/experience/page.tsx`에 저장 후 프리뷰 refresh 이벤트를 연결해 resume 관련 관리자 화면의 진입 방식을 같은 컴포넌트 기준으로 통일했다.

### 3. 범위 조정
- 공개 `/resume` 페이지는 새로 추가했지만, 대규모 퍼블릭 디자인 작업으로 확장하지 않고 resume snapshot을 읽기 좋게 보여주는 최소 범위의 web view만 구현했다.
- project edit/new 화면의 저장 후 라우팅 정책은 기존 동작을 유지했다.
  - 이 이슈에서는 CTA 구조와 프리뷰 진입 방식 통일이 핵심이라, 저장 후 체류 플로우 자체를 바꾸는 것은 범위 밖으로 판단했다.

## 설계 결정 기록
### 결정 1. 이슈 전용 worktree에서만 작업
- 배경: 메인 작업 트리에는 추적되지 않은 변경과 다른 worktree가 이미 존재한다.
- 선택: `codex/admin-resume-preview-workflow` 전용 worktree를 새로 만들고 그 경로에서만 구현과 검증을 진행한다.
- 이유: 이슈 범위를 다른 작업과 분리하고, issue 상태 및 로그 기록과도 일치시키기 쉽다.
- 대안: 기존 detached worktree 또는 메인 작업 트리에서 바로 수정
- 영향: 이후 변경, 테스트, 요약은 모두 이 전용 worktree 기준으로 정리한다.

### 결정 2. preview를 PDF가 아닌 HTML 기반 빠른 확인 흐름으로 정의
- 배경: 기존 `/api/resume`는 `Content-Disposition: attachment` 응답이라 브라우저에서 확인 흐름보다 다운로드 흐름에 가깝다.
- 선택: admin의 `빠른 프리뷰`는 `/resume?preview=1` iframe 시트로 제공하고, `웹 보기`와 `PDF 다운로드`를 별도 액션으로 분리했다.
- 이유: 같은 데이터를 기반으로 하되 컨텍스트 전환 없이 더 빠르게 확인할 수 있고, 세 액션의 역할도 자연스럽게 구분된다.
- 대안: `/api/resume`를 inline PDF preview로 바꾸기, 새 탭 PDF preview를 유지하고 라벨만 조정하기
- 영향: PDF 생성 로직은 그대로 유지하면서 admin 편집 흐름만 개선할 수 있었다.

### 결정 3. 저장 후 프리뷰 갱신은 공통 이벤트로 연결
- 배경: resume 설정, 경험, 프로젝트 편집 화면이 서로 다른 저장 함수를 가지고 있어 특정 화면에만 종속된 프리뷰 갱신 방식은 재사용성이 낮다.
- 선택: `dispatchResumePreviewRefresh()`와 `RESUME_PREVIEW_REFRESH_EVENT`를 추가하고 각 저장 성공 지점에서 공통 이벤트를 보내도록 했다.
- 이유: 공통 프리뷰 컴포넌트가 어느 화면에서든 같은 방식으로 반응할 수 있고, resume 관련 관리자 화면의 진입 방식을 일관되게 맞추기 쉽다.
- 대안: 각 화면이 프리뷰 컴포넌트 상태를 직접 props로 제어, 전역 상태 저장소 도입
- 영향: 컴포넌트 결합도를 낮춘 채로 preview refresh를 공통 행동으로 만들었다.

## 검증
- 실행한 테스트:
  - `gh issue view 36 --json body --jq '.body'`로 `Work Status`가 `진행 중`으로 반영된 것을 확인했다.
  - `git branch --show-current`로 현재 전용 worktree의 브랜치가 `codex/admin-resume-preview-workflow`인 것을 확인했다.
  - `npm run build --prefix frontend` 실행 성공
  - `./frontend/node_modules/.bin/tsc --noEmit -p frontend/tsconfig.json 2>&1 | rg 'ResumeWebView|ResumePreviewButton|ResumeSettingsEditor|app/resume/page|preview-events|admin/resume/page|admin/projects/new/page|admin/projects/\\[id\\]/edit/page|admin/experience/page'` 결과 없음
- 수동 확인:
  - worktree 생성 위치와 브랜치명이 이슈 본문의 Suggested Branch와 일치하는지 확인했다.
  - mock API를 3002에 띄운 뒤 Playwright로 `/resume`이 HTML web view로 렌더되는 것을 확인했다.
  - Playwright로 `/admin/resume` 로그인 후 상단과 우측 카드 모두에서 `빠른 프리뷰` + 액션 메뉴가 노출되는 것을 확인했다.
  - `빠른 프리뷰` 시트 안에서 `웹 보기`, `PDF 다운로드`, iframe 프리뷰가 함께 노출되는 것을 확인했다.
  - `/admin/resume`에서 헤드라인 수정 후 저장하고 다시 프리뷰를 열었을 때 iframe 안의 헤드라인이 최신 값으로 반영되는 것을 확인했다.
  - `/admin/experience` 상단에도 동일한 프리뷰 액션 구조가 노출되는 것을 확인했다.
- 확인하지 못한 항목:
  - 실제 백엔드/실데이터 환경에서 project new/edit 저장 후 redirect 직전 프리뷰 사용감까지는 별도 확인하지 못했다.
  - 저장소 전체 `tsc --noEmit`은 기존 타입 오류 때문에 통과하지 못했다.
  - `next lint`/`eslint`는 현재 저장소의 Next.js 15 + ESLint 설정 조합 문제로 정상 동작하지 않아 이번 작업의 신뢰 가능한 검증 수단으로 사용하지 못했다.

## 남은 이슈 / 후속 작업
- project new/edit 화면은 저장 후 목록으로 이동하는 기존 흐름을 유지했기 때문에, 저장 직후 같은 페이지에서 프리뷰를 연속 확인하는 경험은 resume 설정/경험 화면보다 덜 즉각적이다.
- `/resume` web view는 이번 이슈에서 최소 범위로 만들었으므로, 공개 페이지 브랜딩이나 더 정교한 typography polish는 별도 이슈로 분리하는 편이 적절하다.
- 저장소 전반의 lint/typecheck 환경은 별도 정리가 필요하다. 이번 작업에서는 변경 파일 관련 오류가 추가되지 않았는지까지만 확인했다.
