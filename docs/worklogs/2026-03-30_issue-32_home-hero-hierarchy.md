# 2026-03-30 Issue #32 작업 로그

- 이 파일명은 사용자 요청 형식을 따랐습니다.
- 실제 작업 대상 이슈: `#32 Consolidate surface, panel, and UI variants across the frontend`
- 이슈 링크: https://github.com/Cycrypto/portfolio-blog/issues/32
- 작업 브랜치: `codex/ui-surface-variant-system`
- 작업 worktree: `/Users/cycrpto/.codex/worktrees/issue-32-ui-surface-variant-system`

## 시작 체크

- [x] 별도 git worktree 생성
- [x] issue `Work Status`를 `진행 중`으로 업데이트
- [x] 작업 로그 파일 생성
- [x] 구현 범위 분석
- [x] 구현
- [x] 테스트 및 검증
- [x] issue `Work Status`를 `진행 완료`로 업데이트

## 참고 문서 및 규칙 확인

- 저장소 루트 `AGENTS.md` 확인
- 저장소 루트 `README.md`는 존재하지 않음
- `frontend/README.md` 확인
- `.codex/agents/README.md` 확인

## 범위 메모

- 이슈 본문 기준 작업 범위는 `frontend`의 공용 surface/panel/button/badge 체계 정리다.
- 개별 페이지 정보 구조 재설계, 신규 데이터 기능, 애니메이션 시스템 개편은 범위 밖이다.
- 따라서 공용 UI 토큰과 반복 스타일 흡수에 집중하고, 페이지별 구조 변경은 최소화한다.

## 진행 기록

### 1. 작업 시작

- `Suggested Branch`인 `codex/ui-surface-variant-system`으로 새 worktree를 생성했다.
- 기존 저장소 문서를 확인했지만 사용자 지시에서 언급한 `AGENTS.md`의 `GitHub Issue And Worktree Flow` 섹션과 루트 `README.md`는 현재 저장소에 없다.
- 확인 가능한 문서 기준으로 worktree 분리, 이슈 상태 업데이트, 범위 준수 원칙을 우선 적용한다.
- 사용자 지시에 따라 작업 도중 PR #38(`codex/merge-31-30`) 기준으로 현재 브랜치를 rebase 했다.
- 이유: `frontend/app/globals.css` 계층과 다시 충돌할 가능성이 있어, 최신 UI 병합 기준 위에서 작업을 이어가는 편이 안전하다.

### 2. 구현

- `frontend/app/globals.css`에 `surface-panel`, `surface-panel-elevated`, `surface-panel-subtle`, `surface-panel-glass`를 추가했다.
- `frontend/components/ui/panel.tsx`를 신설해 공용 패널 래퍼를 만들었다.
- `frontend/components/ui/card.tsx`가 기본적으로 공용 panel 계층과 정렬되도록 맞췄다.
- `frontend/components/ui/button.tsx`에 `brand`, `brand-outline`, `brand-soft`, `brand-ghost` variant를 추가했다.
- `frontend/components/ui/badge.tsx`에 `brand`, `brand-outline` variant를 추가했다.
- public 영역에서는 홈 CTA, 블로그 검색/필터, 관련 글/관련 프로젝트, 목차, 작성자 카드, 프로젝트 카드, 기술 스택, 스킬 배지, 프로젝트 기능 패널에 새 계층을 적용했다.
- admin 영역에서는 대시보드 행동 통계 패널과 주요 CTA 버튼을 새 variant/panel 기준으로 정리했다.
- raw glass panel 반복 클래스(`relative overflow-hidden rounded-xl bg-white/80 backdrop-blur-sm border border-brand-blue-200/50 p-6`)는 현재 검색 기준 0건으로 줄였다.

### 3. 범위 조정

- `bg-brand-blue-600 text-white hover:bg-brand-blue-700` 패턴은 저장소 전체에 아직 10건 남아 있다.
- `brand` 버튼 variant로 즉시 치환 가능한 공용/대표 화면 위주만 이번 이슈에서 반영했다.
- 나머지는 개별 화면 맥락이 다른 admin 편집 폼, 특수 CTA, 상태 버튼이라 후속 정리 대상으로 남겼다.
- 이슈 범위를 넘는 페이지 구조 변경이나 개별 정보 재배치는 하지 않았다.

## 설계 결정 및 대안

- 결정 1: `globals.css`의 surface 계층을 `panel` 기준으로 재정의하고 기존 `surface-default`, `surface-elevated`는 호환 alias로 유지한다.
- 이유: 기존 클래스명을 한 번에 제거하면 영향 범위가 너무 넓다. alias를 남기면 점진적으로 `Panel` 컴포넌트로 이동할 수 있다.
- 결정 2: `frontend/components/ui/panel.tsx`를 추가해 public/admin 공용 wrapper를 만든다.
- 이유: 반복되는 raw bordered box가 대부분 `div` 수준이라 `Card`만으로는 흡수하기 어렵다.
- 결정 3: `Button`에 `brand`, `brand-outline`, `brand-ghost`, `Badge`에 `brand`, `brand-outline` variant를 추가한다.
- 이유: 반복되는 브랜드 색 override 패턴이 가장 많고, 기존 `className` 재정의를 줄이는 데 직접적이다.
- 대안 검토: `Card`만 확장해서 모든 패널을 흡수하는 방안.
- 대안 미채택 이유: `Card`는 헤더/본문 조합 전제가 강하고, 현재 raw box 사용처 다수는 단순 wrapper라 적용 비용이 더 크다.
- 범위 조정: 동일 패턴이 반복되는 공용 public 컴포넌트와 admin 대표 화면에 우선 적용하고, 개별 페이지 전체 치환은 이번 이슈 범위에서 제외한다.

## 검증 기록

- `frontend`에서 `npm ci` 실행
- `npx prettier --write` 후 `npx prettier --check`로 이번 변경 파일 포맷 검증 통과
- `npm run lint` 시도
- 결과: 저장소에 `eslint` devDependency가 없어 `next lint` 자체가 실행되지 않음
- `npx tsc --noEmit` 시도
- 결과: 이번 변경과 무관한 기존 타입 오류들 때문에 전체 통과는 불가
- 확인된 기존 타입 오류 예시:
- `app/api/resume/route.ts`의 `Buffer` 응답 타입 문제
- `components/home/creative-hero.tsx`, `components/home/hero-animation.tsx`의 nullable canvas/context 문제
- `components/ui/calendar.tsx`, `components/ui/chart.tsx`, `components/ui/resizable.tsx`의 기존 타입 정의 불일치

## 남은 작업

- 필요 시 남은 brand override 10건과 특수 상태 badge 패턴을 후속 이슈에서 정리한다.
- lint 체계를 복구하려면 `eslint` 의존성과 Next 15 기준 lint 실행 구성을 별도 정비해야 한다.
