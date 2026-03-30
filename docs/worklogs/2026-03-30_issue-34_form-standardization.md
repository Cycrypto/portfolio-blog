# 작업 로그: 폼 구조 표준화

## 기본 정보
- 작성일: 2026-03-30
- GitHub Issue: #34
- 브랜치: `codex/ui-form-standardization`
- 작업자: Codex

## 작업 목표
- 문의 폼과 관리자 핵심 폼에서 반복되는 `Label + Input/Textarea + 보조 텍스트` 패턴을 공용 구조로 정리한다.
- placeholder 의존도를 낮추고, 에러/비활성/제출 중 상태를 일관된 방식으로 표현한다.
- 범위는 `frontend/`의 contact form, 관리자 로그인, 프로젝트 생성/수정 폼으로 제한한다.

## 작업 내역
### 1. 분석
- GitHub issue #34 본문을 확인해 `Work Status`를 `진행 중`으로 변경했다.
- 별도 worktree `/Users/cycrpto/.codex/worktrees/issue-34-ui-home-hero-hierarchy`를 생성해 해당 worktree에서만 작업하도록 분리했다.
- `frontend/components/common/contact-form.tsx`, `frontend/app/admin/login/page.tsx`, `frontend/app/admin/projects/new/page.tsx`, `frontend/app/admin/projects/[id]/edit/page.tsx`를 우선 검토했다.
- 현재 폼들은 `space-y-*`와 개별 `className` override, placeholder 중심 안내, 인라인 에러 박스가 혼재된 상태임을 확인했다.

### 2. 구현
- 진행 예정: 공용 필드 프리미티브 추가
- 진행 예정: 입력/텍스트영역 상태 스타일 정리
- 진행 예정: contact form, 관리자 로그인, 프로젝트 생성/수정 폼 적용

### 3. 범위 조정
- 작업 로그 파일명은 규칙에 맞춰 `2026-03-30_issue-34_form-standardization.md`로 정리했다.
- 작업 내용은 issue #34의 `Suggested Branch`인 `codex/ui-form-standardization` 기준으로 정리한다.

## 설계 결정 기록
### 결정 1. 공용 필드 래퍼를 새로 추가한다
- 배경: contact form과 관리자 폼이 동일한 구조를 각자 다른 마크업으로 반복하고 있었다.
- 선택: 기존 `Input`, `Textarea`, `Label`은 유지하고, 그 위에 얇은 `FieldGroup`/`Field` 계층을 추가하는 방향으로 정리한다.
- 이유: react-hook-form 기반 전면 전환 없이도 issue 범위 안에서 구조, 설명, 에러 표현을 통일할 수 있다.
- 대안: 기존 각 페이지를 개별 정리하거나 `components/ui/form.tsx` 기반으로 전체 폼을 옮기는 방법을 검토했다.
- 영향: 기존 페이지 로직을 크게 흔들지 않으면서 시각적 일관성과 접근성 속성을 함께 끌어올릴 수 있다.

## 검증
- 실행한 테스트: 진행 예정
- 수동 확인: 진행 예정
- 확인하지 못한 항목: 구현 후 기록 예정

## 남은 이슈 / 후속 작업
- contact form의 필드별 에러 노출 범위와 관리자 폼의 설명 문구 밀도를 구현 후 다시 점검할 필요가 있다.
- 프로젝트 생성/수정 폼은 영역이 넓어, 이번 이슈 범위를 넘지 않도록 반복 패턴이 큰 구간 중심으로만 적용한다.
