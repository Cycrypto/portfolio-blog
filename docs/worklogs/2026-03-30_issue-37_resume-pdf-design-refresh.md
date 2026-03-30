# 작업 로그: 이력서 PDF 문서 디자인 리프레시

## 기본 정보
- 작성일: 2026-03-30
- GitHub Issue: #37
- 브랜치: `codex/resume-pdf-design-refresh`
- 작업자: Codex

## 작업 목표
- `frontend/lib/portfolio/resume-pdf.ts`를 중심으로 PDF 이력서의 타이포그래피, 여백, 섹션 위계, 강조 체계를 다시 정리해 첫 페이지 스캔성을 높인다.
- `ResumeSnapshot` 데이터 구조는 최대한 유지하고, 공개 웹 뷰어 라우트나 관리자 편집 UX 전면 개편 없이 표현 계층만 개선한다.

## 작업 내역
### 1. 분석
- GitHub issue #37의 `Summary`, `Scope`, `Out of Scope`, `Acceptance Criteria`를 확인했다.
- `Suggested Branch`인 `codex/resume-pdf-design-refresh` 전용 git worktree가 이미 준비돼 있어 해당 worktree에서만 작업을 이어갔다.
- 구현 전 issue #37의 `Work Status`를 `진행 중`으로 업데이트했다.
- 선행 이슈로 언급된 #35, #36이 모두 `진행 완료` 상태로 정리돼 있음을 확인했다.
- 우선 확인 대상으로 지정된 파일을 먼저 읽었다.
  - `frontend/lib/portfolio/resume-pdf.ts`
  - `frontend/lib/portfolio/build-resume-snapshot.ts`
  - `frontend/app/api/resume/route.ts`
- PDF 내용과 직접 연결되는 관리자 설정 경로를 확인했다.
- `frontend/components/admin/ResumeSettingsEditor.tsx`
- `frontend/lib/api/services/resume-settings.ts`
- `frontend/app/admin/experience/page.tsx`
- `frontend/app/admin/projects/new/page.tsx`
- `frontend/app/admin/projects/[id]/edit/page.tsx`
- 현재 PDF는 헤더, 요약, 기술, 경험, 프로젝트를 순서대로 출력하지만, 헤더와 첫 페이지 상단의 정보 우선순위가 상대적으로 평평하고 경험 섹션의 스캔 포인트가 약한 구조임을 코드 기준으로 확인했다.
- fallback 데이터로 `/api/resume`를 실제 PDF로 생성하고 PNG로 렌더링해 첫 페이지가 지나치게 비어 있고 이름/역할/요약/경험 사이의 위계가 약한 상태임을 시각적으로 확인했다.

### 2. 구현
- `frontend/lib/portfolio/resume-pdf.ts`의 상단 레이아웃을 전면 재구성했다.
  - 상단에 `RESUME` 킥커, 이름, 역할, 헤드라인을 더 강한 타이포그래피로 배치했다.
  - 우측 정보 레일에 contact 정보와 핵심 기술을 모아 첫 페이지 스캔 포인트를 만들었다.
  - 헤더 하단에는 `실무 경력 / 대표 프로젝트 / 핵심 기술` 메트릭 행을 추가해 핵심 숫자가 바로 읽히도록 했다.
- `핵심 요약` 섹션을 번호형 리스트로 바꿔 각 bullet이 분명한 독립 포인트로 읽히도록 조정했다.
- `경험` 블록의 위계를 다시 잡았다.
  - 경험 타입별 색상을 활용한 pill과 좌측 라인 표시를 추가했다.
  - 직함, 조직, 기간, 관련 프로젝트, bullet의 읽는 순서를 더 명확하게 정리했다.
  - 블록 하단 rule과 내부 간격을 재조정해 항목 간 구분을 더 또렷하게 만들었다.
- `주요 프로젝트` 섹션도 같은 문서 톤에 맞춰 제목, 메타, 요약, 기술 스택의 위계를 다시 정리했다.
- `frontend/app/api/resume/route.ts`에서 PDF `Buffer`를 `Uint8Array`로 감싸 응답하도록 보정해 타입 검증 관점의 resume 경로 오류를 줄였다.

### 3. 범위 조정
- 공개 웹 보기 라우트와 관리자 편집 폼 구조는 변경하지 않았다.
- `ResumeSnapshot` 데이터 구조와 resume settings 입력 모델은 유지하고, PDF 표현 계층과 API 응답 타입 보정만 반영했다.

## 설계 결정 기록
### 결정 1. 데이터 구조는 유지하고 PDF 표현 계층만 손본다
- 배경: 이슈 범위는 PDF 문서 디자인 리워크이며, `ResumeSnapshot` 구조 변경은 가급적 피해야 한다.
- 선택: `buildResumeSnapshot()`과 관리자 설정 입력 구조는 유지하고, `resume-pdf.ts`의 레이아웃과 타이포그래피를 중심으로 개선한다.
- 이유: 관련 브랜치인 #35, #36이 이미 `main`에 반영된 상태라, 이번 이슈는 PDF 표현 계층에 집중하는 편이 범위 통제가 쉽다.
- 대안: resume 설정 스키마를 확장해 전용 문서 스타일 옵션을 추가하는 방법
- 영향: 구현 리스크를 줄이고 검증 포인트를 PDF 생성 안정성과 읽기 경험 개선에 집중할 수 있다.

### 결정 2. 첫 페이지는 헤더-메트릭-요약-실무 경험 순서로 재편한다
- 배경: 기존 PDF는 요약과 기술이 위쪽에서 면적을 차지하지만, 이름/역할 이후 바로 눈에 들어오는 구조적 기준점이 부족했다.
- 선택: 상단 헤더를 더 강하게 만들고, 바로 아래에 메트릭 행을 둔 뒤 요약과 실무 경험이 이어지도록 재배치했다.
- 이유: 스캔 순서를 `이름 -> 역할 -> 한 줄 설명 -> 핵심 수치 -> 요약 -> 최근 경험`으로 고정하면 첫 페이지의 읽기 흐름이 더 예측 가능해진다.
- 대안: 카드형 박스를 여러 개 두는 방식, 사진/연락처를 더 크게 강조하는 방식
- 영향: 과도한 장식 없이도 첫 페이지에서 핵심 정보 우선순위가 분명해졌다.

### 결정 3. 경험 타입별 구분은 색상과 라인만으로 처리한다
- 배경: 경력, 팀 프로젝트, 동아리 경험을 모두 같은 톤으로 출력하면 경험 종류와 중요도가 한눈에 구분되지 않는다.
- 선택: 경험 타입별 theme 색상을 pill과 좌측 라인에만 적용하고, 박스형 카드나 배경 패널은 쓰지 않았다.
- 이유: 이력서 문서 특유의 정돈된 인상을 유지하면서도 섹션 내부 스캔성은 높일 수 있다.
- 대안: 경험별 카드 배경색, 큰 배지, 강한 구분 박스
- 영향: 읽는 흐름을 해치지 않으면서 경험 항목의 종류와 덩어리가 더 빨리 구분된다.

## 검증
- 실행한 테스트:
  - 전용 worktree와 브랜치 생성 확인
  - `npm run build --prefix frontend` 실행 성공
  - `./frontend/node_modules/.bin/tsc --noEmit -p frontend/tsconfig.json 2>&1 | rg 'app/api/resume/route.ts|frontend/lib/portfolio/resume-pdf.ts|frontend/lib/portfolio/build-resume-snapshot.ts'` 결과 없음
- 수동 확인:
  - fallback 데이터 기준 `/api/resume` PDF를 생성하고 PNG로 렌더링해 변경 전/후 첫 페이지를 비교했다.
  - 로컬 mock API(`127.0.0.1:3002`)로 resume settings, experiences, projects를 공급한 뒤 `/api/resume`를 다시 렌더링해 2페이지 문서에서 경험/프로젝트 위계와 페이지 나눔을 시각적으로 확인했다.
  - mock 데이터 기준 첫 페이지에서 이름, 역할, 헤드라인, 핵심 요약, 실무 경험이 위계적으로 잘 구분되는지 확인했다.
  - 재시작한 dev 서버에서 `curl -I http://127.0.0.1:3010/api/resume` 응답이 `200 OK`, `content-type: application/pdf`, `content-disposition: attachment`를 유지하는지 확인했다.
- 확인하지 못한 항목:
  - 실제 운영 데이터와 실제 프로필 사진이 연결된 상태에서의 최종 시각 품질은 별도 확인이 필요하다.
  - 저장소 전체 `tsc --noEmit`은 resume 경로와 무관한 기존 타입 오류(`creative-hero`, `hero-animation`, `chart`, `resizable` 등) 때문에 통과하지 못했다.

## 남은 이슈 / 후속 작업
- 실제 운영 resume 데이터가 더 길거나 프로필 사진이 들어오는 경우 상단 우측 정보 레일 높이와 첫 페이지 분량을 한 번 더 확인할 필요가 있다.
- 전체 프런트엔드 타입 오류 정리는 별도 이슈로 분리하는 편이 적절하다. 이번 작업에서는 resume 관련 경로에 새 오류가 추가되지 않았는지만 확인했다.
