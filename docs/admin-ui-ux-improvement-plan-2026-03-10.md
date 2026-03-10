# 관리자 UI/UX 개선 계획 (2026-03-10)

## 목표 우선순위
1. 디자인 일관성
2. UX 개선
3. 성능 개선

## 이번 반영 내용

### 1) 디자인 일관성
- 관리자 공통 셸 도입
  - 페이지별 중복 레이아웃(사이드바/헤더/패딩)을 `AdminShell`로 통합
  - 파일: `frontend/components/admin/AdminShell.tsx`
- 사이드바 디자인 단순화 및 통일
  - 과한 그라디언트/펄스 제거, 활성 상태 시각 언어 일원화
  - 파일: `frontend/components/admin/AdminSidebar.tsx`
- 카드/패널 스타일 정리
  - 관리자 주요 페이지에서 `surface-default` 기반 스타일로 통일
  - 파일:
    - `frontend/app/admin/page.tsx`
    - `frontend/app/admin/posts/page.tsx`
    - `frontend/app/admin/projects/page.tsx`
    - `frontend/app/admin/comments/page.tsx`
    - `frontend/app/admin/contacts/page.tsx`
    - `frontend/app/admin/experience/page.tsx`
    - `frontend/components/admin/ProfileEditor.tsx`

### 2) UX 개선
- 모바일 관리자 내비게이션 개선
  - 모바일에서 햄버거 + 시트 메뉴 제공 (`lg` 미만)
  - 파일: `frontend/components/admin/AdminShell.tsx`
- 페이지 헤더 UX 통일
  - 타이틀/설명/액션 버튼 위치를 전 페이지에서 동일 구조로 제공
- 오류/로딩 상태 가독성 개선
  - 로그인/에러/목록 페이지의 피드백 UI를 표준화
  - 파일:
    - `frontend/app/admin/login/page.tsx`
    - `frontend/app/admin/error.tsx`
    - `frontend/app/admin/layout.tsx`

### 3) 성능 개선
- 관리자 페이지 장식 요소 최소화
  - blur/애니메이션 의존도를 낮춰 렌더 비용 감소
- 중복 레이아웃 제거
  - 공통 셸 기반으로 구성해 클라이언트 렌더 트리 단순화

## 검증 결과
- 빌드: `npm run build --prefix frontend` 통과
- 관리자 UI 점검 리포트: `output/admin-ui-audit-after/report.json`
- 캡처 예시:
  - `output/admin-ui-audit-after/desktop-admin-dashboard.png`
  - `output/admin-ui-audit-after/mobile-admin-dashboard.png`
  - `output/admin-ui-audit-after/desktop-admin-posts.png`

## 다음 단계 (우선순위)

### P1. 디자인 완성도
- 글 작성/수정(`admin/posts/new`, `admin/posts/[id]/edit`) 에디터 화면도 공통 관리자 셸 규칙으로 통합
- 폼 컴포넌트(입력/레이블/에러) 간격/색상 스케일 표준화

### P2. UX 완성도
- 목록 페이지 공통 UX 패턴화
  - 검색/필터/빈 상태/오류 상태 컴포넌트 공통화
- 테이블 모바일 대응 강화
  - 카드형 대체 뷰 또는 컬럼 접기 정책 도입

### P3. 성능 운영
- 관리자 전용 UI 회귀 점검 자동화 유지
  - `scripts/admin_ui_audit.mjs`를 기반으로 배포 전 체크 루틴 추가
- KPI 예시
  - 관리자 주요 화면 `animatedCount = 0` 유지
  - 관리자 주요 화면 `blurCount <= 2` 유지
