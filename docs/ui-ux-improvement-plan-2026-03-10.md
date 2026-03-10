# UI/UX 우선순위 실행 계획 (2026-03-10)

## 목표
- 1순위: 디자인 일관성 강화
- 2순위: UX 단순화 및 오류/빈 상태 경험 개선
- 3순위: 렌더링/애니메이션 성능 개선

## 반영 결과 요약 (이번 작업)

### 1) 디자인 일관성
- 공통 surface 토큰 추가
  - `surface-default`, `surface-elevated`, `section-spacing`
  - 파일: `frontend/app/globals.css`
- 섹션 헤더 시각 스타일 단순화
  - pulse/과한 gradient 제거, 타이포 중심 구성
  - 파일: `frontend/components/common/section-heading.tsx`
- 카드 계열 스타일 통일
  - `GlassmorphicCard`, `BlogCard`, `ProjectCard`, `ContactForm`, `Timeline`에 공통 surface 적용
  - 파일:
    - `frontend/components/common/glassmorphic-card.tsx`
    - `frontend/components/blog/blog-card.tsx`
    - `frontend/components/project/project-card.tsx`
    - `frontend/components/common/contact-form.tsx`
    - `frontend/components/home/timeline.tsx`

### 2) UX 개선
- 홈 정보 구조 단순화
  - 홈 섹션 수 축소: 8 -> 6 (경험 섹션 홈에서 제외)
  - 프로젝트/블로그 카드 노출 수 축소: 6 -> 3
  - 파일: `frontend/app/page.tsx`
- 내비게이션 단순화
  - 플로팅 네비 메뉴 축소(소개/프로젝트/블로그/연락)
  - 모바일 풀스크린 메뉴 제거, 드롭다운 패널 전환
  - 파일: `frontend/components/common/layout/floating-nav.tsx`
- 오류/빈 상태 UX 강화
  - 홈 데이터 부분 실패 시 경고 + 재시도 버튼 제공
  - 블로그 오류 상태에 재시도 버튼 제공
  - 타임라인 빈 상태/로딩 상태 명시
  - 파일:
    - `frontend/app/page.tsx`
    - `frontend/app/blog/page.tsx`
    - `frontend/components/home/timeline.tsx`
- 모바일 검색 UX 개선
  - 블로그 헤더에서 검색영역을 모바일 우선 배치
  - 파일: `frontend/app/blog/page.tsx`

### 3) 성능 개선
- 모션 접근성 대응
  - `prefers-reduced-motion` 대응 추가
  - 파일: `frontend/app/globals.css`
- 히어로 캔버스 최적화
  - resize 시 scale 누적 버그 수정 (`setTransform` 사용)
  - O(n^2) 연결 연산 축소(이웃 제한 + 거리 제곱 비교)
  - 파티클 수 상한 적용 및 reduced motion 분기
  - mousemove 리스너/animation frame 정리(메모리 누수 방지)
  - 파일: `frontend/components/home/creative-hero.tsx`

## 지표 비교 (자동 점검)
- 기준 리포트(변경 전): `output/ui-audit/report.json`
- 최신 리포트(변경 후): `output/ui-audit-after/report.json`

### 홈(Desktop)
- sections: `8 -> 6`
- animated: `14 -> 0`
- blur: `48 -> 18`
- gradients: `57 -> 18`

### 홈(Mobile)
- sections: `8 -> 6`
- animated: `14 -> 0`
- blur: `49 -> 18`

## 우선순위 기반 다음 계획

### P1. 디자인 일관성 고도화 (다음 스프린트 1)
- 상세 페이지(`blog/[id]`, `projects/[slug]`) 카드/헤더도 동일 surface 규칙으로 통합
- 그라디언트 버튼 규칙 통일(Primary/Secondary/Outline 3종 고정)
- 목표: 페이지 간 스타일 편차 최소화

### P2. UX 완성도 향상 (다음 스프린트 1~2)
- 홈 각 섹션의 데이터 부재 시 섹션 자체를 더 압축 표시
- 블로그 필터/검색 결과 영역의 모바일 밀도 추가 최적화
- 목표: 데이터가 없어도 “빈 화면 느낌” 제거

### P3. 성능/품질 운영 (다음 스프린트 2)
- UI 회귀 자동 점검 스크립트 정식화(`scripts/ui_audit_after.mjs` 기반)
- KPI 임계치 운영
  - home `animatedCount <= 2`
  - home `blurCount <= 15`
  - mobile/home 섹션 체감 스크롤 길이 추가 점검
- 목표: 리디자인 이후 재복잡화 방지

## 검증 결과
- `npm run build --prefix frontend` 통과
- 참고: `next lint`는 현재 `eslint` 미설치로 실행 불가
