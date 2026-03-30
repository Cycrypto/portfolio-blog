# 작업 로그: 홈 hero 위계 재구성

## 기본 정보
- 작성일: 2026-03-30
- GitHub Issue: #33
- 브랜치: `codex/ui-home-hero-hierarchy`
- 작업자: Codex

## 작업 목표
- 홈 첫 화면의 정보 밀도를 줄이고, 하나의 주 메시지와 시각 앵커가 먼저 읽히는 hero 구성을 만든다.
- 기존 데이터 소스는 유지하고, 통계/최근 글/기술 pill 중 일부를 다음 섹션으로 이동해 첫 화면의 집중도를 높인다.
- 범위 밖 항목인 전체 홈 페이지 리디자인, 백엔드 변경, 목록 레이아웃 변경은 제외한다.

## 작업 내역
### 1. 분석
- GitHub issue #33 본문에서 Suggested Branch와 Acceptance Criteria를 확인했다.
- `/Users/cycrpto/Desktop/my-blog/AGENTS.md`의 GitHub Issue And Worktree Flow와 `/Users/cycrpto/Desktop/my-blog/docs/worklogs/README.md` 규칙을 읽고 절차를 정리했다.
- 메인 저장소에서 `codex/ui-home-hero-hierarchy` 전용 worktree를 `/Users/cycrpto/.codex/worktrees/issue-33-home-hero-hierarchy`로 생성했다.
- issue의 Work Status를 `진행 중`으로 업데이트했다.
- `frontend/app/page.tsx`를 기준으로 현재 hero가 텍스트, 상태 pill, 소셜 버튼, 프로필 카드, 통계 4개, 최근 글, 기술 pill을 첫 화면에 동시에 배치하고 있음을 확인했다.
- `frontend/lib/portfolio/build-portfolio-snapshot.ts`를 확인해 통계와 최근 글, 기술 데이터는 이미 snapshot에서 제공되고 있어 데이터 소스 변경 없이 구조만 재배치할 수 있음을 확인했다.

### 2. 구현
- hero를 `메시지 영역 + 단일 시각 앵커`의 2열 구성으로 재편했다.
- 왼쪽에는 이름/직군 pill, 핵심 메시지, 보조 설명, 주 CTA, 최소 상태 정보만 남겼다.
- 오른쪽에는 기존 프로필 요약 카드 대신 하나의 큰 비주얼 패널을 두고, 내부 정보는 이름, 상태 메시지, 경력/주요 기술 2개 메타만 유지했다.
- hero 내부에 있던 통계, 최근 글, 기술 pill은 바로 아래의 `Quick Facts / Recent Writing / Stack Snapshot` 요약 밴드로 이동했다.
- 새 요약 밴드는 기존 `metrics`, `featuredPosts`, `profile.skills`를 그대로 사용해 이슈 범위 안에서 정보 재배치만 수행했다.
- about 섹션 이하의 전체 흐름은 유지하고, 이슈 범위를 넘는 전면 리디자인은 하지 않았다.

### 3. 범위 조정
- 최근 글과 기술 정보를 별도 섹션으로 완전히 분리하는 안도 검토했지만, 이슈가 요구한 범위는 hero 집중도 개선이므로 hero 직후 한 개의 요약 밴드로만 정리했다.
- 로컬 환경에서 백엔드 API가 연결되지 않아 프로필 데이터는 fallback 상태로 렌더링되었지만, 구조 검증 자체는 fallback 데이터 기준으로 수행했다.

## 설계 결정 기록
### 결정 1. 이슈 전용 worktree를 별도로 생성
- 배경: 현재 작업 디렉터리는 detached HEAD 기반 임시 worktree였고, 이슈 범위를 격리해야 했다.
- 선택: 메인 저장소 `/Users/cycrpto/Desktop/my-blog`에서 Suggested Branch 이름 그대로 새 브랜치와 worktree를 만들었다.
- 이유: 이슈 지시사항과 AGENTS.md 규칙을 직접 충족하고, 다른 작업과 변경 충돌을 막을 수 있다.
- 대안: 기존 detached worktree에서 바로 브랜치를 체크아웃하는 방법을 검토했지만, 이슈별 작업 격리 조건에 맞지 않아 제외했다.
- 영향: 이후 모든 구현, 테스트, 로그 기록은 이 worktree에서만 진행한다.

### 결정 2. hero 안의 보조 정보는 삭제하지 않고 아래 요약 밴드로 이동
- 배경: 통계, 최근 글, 기술 pill을 hero에서 제거하면 첫 화면은 단순해지지만, 기존 정보 가치를 잃을 수 있었다.
- 선택: hero는 메시지와 비주얼에 집중시키고, 보조 정보는 hero 직후의 단일 요약 밴드로 이동했다.
- 이유: 첫 화면의 카드 수를 줄이면서도 기존 데이터 소스를 유지하고, 사용자가 한 번의 스크롤 없이도 핵심 보조 정보를 이어서 볼 수 있다.
- 대안: about 섹션 뒤로 완전히 이동하는 방법을 검토했지만, 정보 접근성이 과하게 늦어져 제외했다.
- 영향: hero는 단순해졌고, 보조 정보는 하나의 연속된 섹션에서 다시 소비된다.

### 결정 3. hero 우측은 프로필 요약 카드 대신 단일 비주얼 패널로 단순화
- 배경: 기존 우측 카드 안에 프로필, 통계, 최근 글, 스킬이 모두 들어 있어 hero의 주 메시지를 압도하고 있었다.
- 선택: 우측 영역을 하나의 큰 visual plane으로 바꾸고, 내부 메타는 이름, 상태 메시지, 경력/기술 두 줄만 유지했다.
- 이유: issue의 "single dominant composition" 요구를 가장 직접적으로 만족하고, 첫 화면의 시선 흐름을 좌측 메시지 -> 우측 앵커로 고정할 수 있다.
- 대안: 기존 카드 스타일을 유지한 채 일부 블록만 삭제하는 방법은 구조적 인상이 크게 달라지지 않아 제외했다.
- 영향: 모바일에서는 시각 패널이 첫 화면 하단으로 내려가고, 데스크톱에서는 메시지와 비주얼의 역할이 명확히 분리된다.

## 검증
- 실행한 테스트:
  - `git worktree add -b codex/ui-home-hero-hierarchy /Users/cycrpto/.codex/worktrees/issue-33-home-hero-hierarchy origin/main`
  - `npm ci` (`frontend/`)
  - `npm run build` (`frontend/`) 2회 재실행하여 변경 후에도 성공 확인
  - `npx playwright screenshot --browser chromium --viewport-size "1440,1100" --wait-for-timeout 1500 http://127.0.0.1:3101 ...`
  - `npx playwright screenshot --browser chromium --viewport-size "390,844" --wait-for-timeout 1500 http://127.0.0.1:3101 ...`
- 수동 확인:
  - 데스크톱 캡처에서 hero 첫 화면이 큰 제목, 2개 CTA, 최소 상태 정보, 단일 비주얼 패널 중심으로 정리된 것을 확인했다.
  - 모바일 캡처에서 제목과 CTA가 첫 화면 우선순위를 유지하고, 비주얼 패널은 하단으로 자연스럽게 이어지는 것을 확인했다.
- 확인하지 못한 항목:
  - 로컬 백엔드 미기동 상태라 실제 프로필 API 응답 기반 최종 카피/이미지 조합은 확인하지 못했다.
  - `next start`는 다중 lockfile로 인한 workspace root 추론 이슈 때문에 동일 worktree에서 바로 확인하지 못했다.

## 남은 이슈 / 후속 작업
- 프로필 API가 정상 연결되면 실제 프로필 이미지와 상태 메시지 길이에 따라 hero 우측 패널 텍스트 밀도를 한 번 더 확인할 필요가 있다.
- 현재 `npm run build`는 성공하지만 Next.js가 상위 lockfile을 workspace root로 잡는 경고가 지속된다. 이는 이번 이슈 범위 밖이라 구조 변경에는 포함하지 않았다.
