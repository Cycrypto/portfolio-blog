# Tiptap 에디터 전환 구현 계획서 (v15)

## 📋 문서 정보

- **작성일**: 2025-12-30
- **버전**: 1.1
- **핵심 관점**: 에디터 변경이 중심이며, 나머지 변경은 **에디터 전환에 따른 필수 영향 범위**로 한정
- **참조 문서**: docs/6 ~ docs/13

---

## 🎯 목표

1. 관리자 에디터를 Markdown 기반 `@uiw/react-md-editor`에서 **Tiptap WYSIWYG**로 전환
2. Tiptap JSON을 **서버에서 HTML로 렌더링 + Sanitize**하여 읽기 화면에 사용
3. 기존 Markdown 포스트는 **호환 유지**하고 점진적으로 전환 가능하도록 설계

---

## ✅ 범위 정의

### 포함 (에디터 전환에 직접 필요한 변경)
- Tiptap Editor UI 도입 및 관리자 페이지 연동
- 콘텐츠 저장 포맷 변경 (Markdown → Tiptap JSON)
- 서버 렌더링 파이프라인 구축 (HTML 캐시, headings, plainText)
- TOC/읽기 페이지 렌더링 방식 단일화
- 마이그레이션/백필 작업 (기존 Markdown 유지)
- XSS 방어를 위한 서버 Sanitize (DOMPurify)

### 제외 (에디터 전환과 직접 관련 없는 변경)
- 인증 방식 전면 재설계 (Cookie/CSRF 전환)
- CSP/보안 헤더 고도화 (단, 콘텐츠 보안은 포함)
- 인프라 레벨 구조 변경 (배포/모니터링 등)

---

## ✅ 결정 사항 (비가역)

- **SSOT**: `contentType='tiptap'`은 `contentJson`이 단일 소스, 레거시만 `contentMarkdown` 사용
- **캐시 생성**: 저장/수정 시 `contentHtml/plainText/headings/wordCount` 생성, 조회 시 누락분 백필
- **레거시 편집**: 기존 Markdown 포스트는 Markdown 에디터로 편집 유지 (변환은 선택 과제)
- **TOC/Heading**: Heading ID/TOC는 서버에서만 생성
- **이미지 정책**: 1차 릴리즈는 외부 URL만 허용, 업로드는 별도 과제

---

## ✅ API 계약 (최소)

### Create/Update 요청
- `contentType: 'tiptap' | 'markdown'`
- `contentJson?: JSONContent`
- `contentMarkdown?: string`

### Read 응답 (읽기 페이지)
- `contentHtml: string`
- `headings: Heading[]`
- `wordCount?: number`
- `readingTime?: number`

### Edit 응답 (관리 편집)
- `contentType`
- `contentJson` 또는 `contentMarkdown`

---

## ✅ 데이터 무결성 규칙

- `contentType='tiptap'` → `contentJson` 필수, `contentMarkdown`은 null
- `contentType='markdown'` → `contentMarkdown` 필수, `contentJson`은 null
- 캐시 필드는 파생 데이터이며 누락 시 조회 시점에 생성 가능

---

## 🧭 구현 단계

### Phase 0: 기준 정의 및 영향 범위 확정

- 기존 에디터 사용 위치 파악 (작성/수정 페이지, 미리보기 컴포넌트)
- Tiptap 확장 범위 결정 (이미지, 링크, 테이블, 코드블록 등)
- 기존 Markdown 포스트 유지 원칙 확정 (Backward Compatibility)

**결과물**
- 확정된 Tiptap Extension 목록
- 편집/저장/렌더링 흐름 다이어그램

---

### Phase 1: 데이터 모델 및 렌더링 파이프라인 구축

#### 1.1 DB 스키마 확장
- `contentType`, `contentJson`, `contentMarkdown`, `contentHtml`, `plainText`, `headings`, `wordCount` 추가
- 기존 `content` → `contentMarkdown`로 이관

#### 1.2 서버 렌더링 유틸 구현
- Tiptap JSON → HTML (`generateHTML`)
- Markdown → HTML (`marked`)
- HTML 후처리: heading ID 주입 + dedupe
- DOMPurify로 서버 단 Sanitize (XSS 방어 단일화)

**결과물**
- `content-renderer` 유틸 및 파이프라인 완성
- HTML/TOC/PlainText 캐시 생성 로직

---

### Phase 2: 백엔드 저장/조회 흐름 변경

#### 2.1 DTO 및 API 수정
- 생성/수정 DTO에 `contentJson` 지원
- 편집 전용 응답에 `contentJson` 포함 (읽기 응답은 `contentHtml` 중심)

#### 2.2 저장 시 캐시 자동 생성
- 저장/수정 시 HTML/PlainText/Headings/WordCount 계산 (실패 시 저장 실패)
- 조회 시 캐시 없으면 백필 (점진적 마이그레이션)

**결과물**
- 저장/수정/조회 API가 Tiptap JSON 기반으로 정상 동작

---

### Phase 3: 관리자 에디터 UI 전환

#### 3.1 패키지/컴포넌트 구현
- `@tiptap/react`, `@tiptap/starter-kit` 및 확장 설치
- `TiptapEditor` 컴포넌트 및 메뉴바 구현
- 에디터 CSS 및 스타일 적용

#### 3.2 관리자 페이지 연동
- 작성/수정 화면에서 JSON 상태 관리
- 저장 요청 시 `contentJson` 전송
- 기존 Markdown 포스트는 Markdown 에디터로 편집 유지

**결과물**
- 신규 포스트는 Tiptap 기반으로 작성/저장
- 기존 Markdown 포스트는 그대로 편집 가능

---

### Phase 4: 읽기 페이지 렌더링 전환

- 읽기 페이지에서 `contentHtml`만 렌더링 (클라이언트 분기 제거)
- TOC는 서버에서 계산된 `headings` 사용 (클라이언트 계산 없음)

**결과물**
- 렌더링 방식 단일화 (HTML only)
- SEO/성능 개선 기반 확보

---

### Phase 5: 마이그레이션 및 운영 적용

- Step 1: 기존 `content` → `contentMarkdown` 이관
- Step 2: 레거시 Markdown 렌더 → `contentHtml/plainText/headings` 배치 생성
- Step 3: 실패 레코드 리포트 및 재시도
- 필요 시 Markdown → Tiptap 변환 도구 제공 (선택)

**결과물**
- 기존 데이터 손실 없이 점진적 전환 완료

---

## ✅ 테스트/검증 체크리스트

### 필수 기능 검증
- Tiptap 편집 기능(제목/리스트/링크/이미지/표) 동작 확인
- 저장 후 읽기 페이지 정상 렌더링 확인
- Markdown 포스트 렌더링 및 편집 유지 확인

### 보안 검증 (에디터 영향 범위)
- 악성 HTML/스크립트 입력 시 서버 Sanitize 적용 확인
- TOC ID 생성/중복 처리 정상 동작

---

## ✅ 롤백 전략 (최소)

- 문제 발생 시 **관리자 Tiptap 편집 UI만 비활성화** (읽기는 HTML 캐시로 유지)
- DB 스키마는 유지하고, 신규 작성만 제한하여 영향 최소화

---

## 🚨 주요 리스크 및 대응

| 리스크 | 영향 | 대응 |
|--------|------|------|
| Tiptap JSON 저장 실패 | 신규 작성 불가 | 작성 단계에서 JSON 유효성 체크 + 오류 메시지 |
| 렌더링 파이프라인 오류 | 읽기 화면 깨짐 | 서버 fallback HTML 제공 + 백필 재시도 |
| 기존 Markdown 호환성 | 기존 포스트 손상 | contentMarkdown 유지 + 변환은 선택적 |

---

## ⚠️ 주의 사항

- DOMPurify만으로 끝나지 않음: 이미지 `src` 정책이 운영 리스크 1순위
- 레거시 변환은 손실 가능성이 높아 QA 비용 증가
- 읽기 단일화는 캐시 무결성/백필 규칙이 전제

---

## ✅ 완료 기준 (Definition of Done)

- 신규 포스트 작성/수정이 Tiptap 기반으로 완료됨
- 읽기 화면은 `contentHtml`만 렌더링하며, TOC 정상 동작
- 기존 Markdown 포스트가 유지되며 오류 없이 표시/편집 가능
- 서버 Sanitize 단일화로 XSS 방어 적용됨

---

## 📌 요약

이 계획의 핵심은 **에디터 전환 자체**이며, 데이터 모델·렌더링·보안 변경은
**Tiptap 도입으로 인해 필수적으로 발생하는 영향 범위만 최소 적용**합니다.
추가 보안/인증 개선은 별도 프로젝트로 분리하여 범위를 통제합니다.
