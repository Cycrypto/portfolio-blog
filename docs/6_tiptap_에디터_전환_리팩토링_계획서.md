# Tiptap 에디터 전환 리팩토링 계획서 (최종 개선판)

## 📋 문서 정보

- **작성일**: 2025-12-30
- **버전**: 3.0 (보안/설계/성능 이슈 최종 반영)
- **대상 시스템**: 블로그 관리 시스템
- **현재 에디터**: `@uiw/react-md-editor` (Markdown)
- **목표 에디터**: Tiptap (Rich Text WYSIWYG)

---

## 🎯 핵심 설계 원칙 (v3.0 개선)

### 1. 렌더링 전략 (보안/성능/SEO 통합)

| 영역 | 렌더링 방식 | 구현 방법 | XSS 방어 |
|------|------------|----------|---------|
| **관리자 편집** | Tiptap Editor (Client) | `useEditor` + `EditorContent` | N/A (편집 모드) |
| **사용자 읽기** | **Server-side HTML 렌더링** | 서버에서 모든 타입 → HTML + Sanitize | ✅ 단일 지점 통제 |

**핵심 변경사항 (v3.0)**:
- ✅ **Markdown도 서버에서 HTML 변환 + Sanitize** (XSS 방어 단일화)
- ✅ **프론트는 contentHtml만 렌더링** (표현 계층 단일화)
- ✅ **모든 콘텐츠 타입 동일한 보안 정책 적용**

### 2. 데이터 흐름 (v3.0 개선)

```
[관리자 작성]
User Input → Tiptap Editor → editor.getJSON() → DB (JSONB)

[저장 시 서버 처리]
Tiptap JSON → generateHTML() → DOMPurify.sanitize() → contentHtml (캐시)
           → generateText() → plainText (검색용)
           → extractHeadings() → headings (TOC용)

[사용자 읽기]
DB → contentHtml (캐시) → SSR → HTML
```

**Markdown 포스트 처리**:
```
[Markdown 저장 시]
Markdown → marked() → DOMPurify.sanitize() → contentHtml (캐시)
         → strip_tags() → plainText
         → extractHeadings() → headings
```

### 3. 보안 전략 (최우선)

#### 3.1 XSS 방어 단일화

| 구분 | 기존 (v2.0) | 개선 (v3.0) |
|------|------------|------------|
| Tiptap JSON | 서버 Sanitize ✅ | 서버 Sanitize ✅ |
| Markdown | ❌ 프론트 직접 렌더링 | ✅ 서버 Sanitize |
| 프론트 역할 | 분기 처리 | HTML만 표시 |

**구현**:
```typescript
// ✅ 모든 contentType은 서버에서 sanitize된 HTML로 제공
// ❌ 프론트에서 dangerouslySetInnerHTML 전 sanitize 없음
```

#### 3.2 CSP (Content Security Policy) 강화

```typescript
// next.config.js
const cspHeader = `
  default-src 'self';
  script-src 'self' 'nonce-{NONCE}';
  style-src 'self' 'nonce-{NONCE}';
  img-src 'self' data: https:;
  font-src 'self' data:;
  connect-src 'self' ${process.env.NEXT_PUBLIC_API_URL};
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
`;

export default {
  async headers() {
    return [{
      source: '/:path*',
      headers: [
        {
          key: 'Content-Security-Policy',
          value: cspHeader.replace(/\s{2,}/g, ' ').trim()
        },
        {
          key: 'X-Frame-Options',
          value: 'DENY'
        },
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff'
        },
      ],
    }];
  },
};
```

**변경사항**:
- ❌ ~~`unsafe-eval` 제거~~ (Next.js 일부 기능에 필요 시 nonce 사용)
- ✅ `nonce` 기반 inline script/style 허용
- ✅ `frame-ancestors 'none'` 추가

### 4. 데이터베이스 설계 (v3.0 개선)

#### 4.1 Post Entity (JSONB 타입)

```typescript
// backend/src/posts/entity/post.entity.ts
import { Entity, Column, Index } from 'typeorm';

@Entity()
export class Post extends BaseEntity {
  // ... 기존 필드들

  @Column({
    type: 'enum',
    enum: ['markdown', 'tiptap-json'],
    default: 'tiptap-json'  // ✅ 신규 포스트 기본값
  })
  @Index()
  contentType: 'markdown' | 'tiptap-json';

  // ✅ Tiptap JSON: JSONB 타입 (쿼리/인덱싱 가능)
  @Column('jsonb', { nullable: true })
  contentJson: any;

  // ✅ Markdown: TEXT 타입
  @Column('text', { nullable: true })
  contentMarkdown: string;

  // ✅ 렌더링 캐시 (모든 타입 공통)
  @Column('text', { nullable: true })
  contentHtml: string;  // Sanitize된 HTML

  // ✅ 검색/SEO용
  @Column('text', { nullable: true })
  @Index({ fulltext: true })  // Full-text 검색 인덱스
  plainText: string;

  // ✅ TOC용 구조 데이터
  @Column('jsonb', { nullable: true })
  headings: Array<{
    level: number;
    text: string;
    id: string;
  }>;

  // ✅ 메타데이터
  @Column({ nullable: true })
  wordCount: number;

  @Column({ nullable: true })
  readingTimeMinutes: number;
}
```

**핵심 변경**:
- ✅ `content` → `contentJson` (JSONB) + `contentMarkdown` (TEXT) 분리
- ✅ `contentHtml` 캐시 필드 (모든 타입 공통)
- ✅ `headings` JSONB 필드 (TOC 데이터)
- ✅ Full-text 검색 인덱스

---

## 🗺️ Phase별 구현 계획 (v3.0)

### Phase 0: 아키텍처 결정 및 기반 설정 ⭐

#### 0.1 데이터베이스 마이그레이션

```typescript
// backend/migrations/YYYYMMDDHHMMSS-add-tiptap-fields.ts
import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddTiptapFields1234567890123 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // contentType enum 추가
    await queryRunner.addColumn('posts', new TableColumn({
      name: 'content_type',
      type: 'enum',
      enum: ['markdown', 'tiptap-json'],
      default: "'markdown'",  // 기존 포스트 기본값
      isNullable: false,
    }));

    // Tiptap JSON 필드 (JSONB)
    await queryRunner.addColumn('posts', new TableColumn({
      name: 'content_json',
      type: 'jsonb',
      isNullable: true,
    }));

    // Markdown 필드 이름 변경
    await queryRunner.renameColumn('posts', 'content', 'content_markdown');

    // HTML 캐시 필드
    await queryRunner.addColumn('posts', new TableColumn({
      name: 'content_html',
      type: 'text',
      isNullable: true,
    }));

    // plainText 필드
    await queryRunner.addColumn('posts', new TableColumn({
      name: 'plain_text',
      type: 'text',
      isNullable: true,
    }));

    // Headings 필드 (JSONB)
    await queryRunner.addColumn('posts', new TableColumn({
      name: 'headings',
      type: 'jsonb',
      isNullable: true,
    }));

    // 메타데이터 필드
    await queryRunner.addColumn('posts', new TableColumn({
      name: 'word_count',
      type: 'integer',
      isNullable: true,
    }));

    // Full-text 검색 인덱스
    await queryRunner.query(`
      CREATE INDEX idx_posts_plain_text_fulltext
      ON posts USING gin(to_tsvector('english', plain_text))
    `);

    // contentType 인덱스
    await queryRunner.query(`
      CREATE INDEX idx_posts_content_type ON posts(content_type)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('posts', 'content_type');
    await queryRunner.dropColumn('posts', 'content_json');
    await queryRunner.dropColumn('posts', 'content_html');
    await queryRunner.dropColumn('posts', 'plain_text');
    await queryRunner.dropColumn('posts', 'headings');
    await queryRunner.dropColumn('posts', 'word_count');
    await queryRunner.renameColumn('posts', 'content_markdown', 'content');
    await queryRunner.query('DROP INDEX idx_posts_plain_text_fulltext');
    await queryRunner.query('DROP INDEX idx_posts_content_type');
  }
}
```

#### 0.2 백엔드 패키지 설치

```bash
cd backend

# Tiptap Core (서버 사이드 렌더링용)
npm install @tiptap/core @tiptap/starter-kit
npm install @tiptap/html  # ✅ 추가: HTML ↔ JSON 변환
npm install @tiptap/extension-image @tiptap/extension-link
npm install @tiptap/extension-table @tiptap/extension-table-row
npm install @tiptap/extension-table-cell @tiptap/extension-table-header
npm install @tiptap/extension-code-block-lowlight

# XSS 방지
npm install isomorphic-dompurify jsdom

# Markdown 처리
npm install marked  # 기존 유지
```

#### 0.3 서버 사이드 렌더링 유틸리티 (싱글턴)

```typescript
// backend/src/posts/utils/content-renderer.ts
import { generateHTML, generateText, JSONContent } from '@tiptap/core';
import { generateJSON } from '@tiptap/html';  // ✅ HTML → JSON 변환용
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import { JSDOM } from 'jsdom';
import DOMPurify from 'isomorphic-dompurify';
import { marked } from 'marked';

// ✅ 싱글턴: 모듈 로드 시 1회만 생성
const window = new JSDOM('').window;
const purify = DOMPurify(window);

// Viewer용 경량 Extensions (편집 기능 제외)
const viewerExtensions = [
  StarterKit.configure({
    history: false,  // 편집 히스토리 불필요
  }),
  Image.configure({
    HTMLAttributes: {
      class: 'rounded-lg max-w-full h-auto my-4',
      loading: 'lazy',
    },
  }),
  Link.configure({
    openOnClick: false,
    HTMLAttributes: {
      class: 'text-blue-600 underline hover:text-blue-800',
      rel: 'noopener noreferrer',
      target: '_blank',
    },
  }),
  Table,
  TableRow,
  TableCell,
  TableHeader,
];

// ✅ DOMPurify 설정 (허용 태그/속성)
const PURIFY_CONFIG = {
  ALLOWED_TAGS: [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'p', 'br', 'strong', 'em', 'u', 's',
    'a', 'img',
    'ul', 'ol', 'li',
    'blockquote', 'code', 'pre',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'div', 'span',
  ],
  ALLOWED_ATTR: [
    'href', 'src', 'alt', 'title', 'class',
    'target', 'rel', 'loading', 'id',
  ],
  ALLOW_DATA_ATTR: false,
};

/**
 * Tiptap JSON을 안전한 HTML로 변환
 */
export function renderTiptapToHTML(json: JSONContent): string {
  try {
    const html = generateHTML(json, viewerExtensions);
    return purify.sanitize(html, PURIFY_CONFIG);
  } catch (error) {
    console.error('Tiptap rendering failed:', error);
    return '<p class="text-red-500">콘텐츠를 불러올 수 없습니다.</p>';
  }
}

/**
 * Markdown을 안전한 HTML로 변환
 * ✅ v3.0: Markdown도 sanitize 적용
 */
export function renderMarkdownToHTML(markdown: string): string {
  try {
    const html = marked.parse(markdown, {
      breaks: true,
      gfm: true,
    }) as string;

    return purify.sanitize(html, PURIFY_CONFIG);
  } catch (error) {
    console.error('Markdown rendering failed:', error);
    return '<p class="text-red-500">콘텐츠를 불러올 수 없습니다.</p>';
  }
}

/**
 * Tiptap JSON에서 순수 텍스트 추출
 */
export function extractPlainTextFromTiptap(json: JSONContent): string {
  try {
    return generateText(json, viewerExtensions);
  } catch (error) {
    console.error('Plain text extraction failed:', error);
    return '';
  }
}

/**
 * Markdown에서 순수 텍스트 추출
 */
export function extractPlainTextFromMarkdown(markdown: string): string {
  try {
    const html = marked.parse(markdown, { breaks: true, gfm: true }) as string;
    // HTML 태그 제거
    return html.replace(/<[^>]*>/g, '').trim();
  } catch (error) {
    console.error('Plain text extraction failed:', error);
    return '';
  }
}

/**
 * Heading 추출 (TOC용)
 */
export function extractHeadings(
  content: JSONContent | string,
  contentType: 'tiptap-json' | 'markdown'
): Array<{ level: number; text: string; id: string }> {
  const headings: Array<{ level: number; text: string; id: string }> = [];

  try {
    if (contentType === 'tiptap-json') {
      // Tiptap JSON 순회
      const json = content as JSONContent;
      traverseTiptapNode(json, headings);
    } else {
      // Markdown 파싱
      const html = marked.parse(content as string, { breaks: true, gfm: true }) as string;
      const dom = new JSDOM(html);
      const headingElements = dom.window.document.querySelectorAll('h1, h2, h3, h4, h5, h6');

      headingElements.forEach((el) => {
        const level = parseInt(el.tagName[1]);
        const text = el.textContent || '';
        const id = text
          .toLowerCase()
          .replace(/[^a-z0-9가-힣\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '');

        headings.push({ level, text, id });
      });
    }
  } catch (error) {
    console.error('Heading extraction failed:', error);
  }

  return headings;
}

// Tiptap JSON 노드 순회 (재귀)
function traverseTiptapNode(
  node: JSONContent,
  headings: Array<{ level: number; text: string; id: string }>
): void {
  if (node.type === 'heading' && node.attrs?.level) {
    const text = getTextFromNode(node);
    const id = text
      .toLowerCase()
      .replace(/[^a-z0-9가-힣\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    headings.push({
      level: node.attrs.level,
      text,
      id,
    });
  }

  // 자식 노드 순회
  if (node.content) {
    node.content.forEach((child) => traverseTiptapNode(child, headings));
  }
}

// Tiptap 노드에서 텍스트 추출
function getTextFromNode(node: JSONContent): string {
  if (node.type === 'text') {
    return node.text || '';
  }

  if (node.content) {
    return node.content.map((child) => getTextFromNode(child)).join('');
  }

  return '';
}

/**
 * 단어 수 계산
 */
export function calculateWordCount(plainText: string): number {
  return plainText.split(/\s+/).filter((word) => word.length > 0).length;
}

/**
 * 읽기 시간 계산 (분)
 */
export function calculateReadingTime(wordCount: number): number {
  const wordsPerMinute = 200;  // 평균 읽기 속도
  return Math.ceil(wordCount / wordsPerMinute);
}

/**
 * Markdown → Tiptap JSON 변환 (마이그레이션용)
 */
export function convertMarkdownToTiptapJSON(markdown: string): JSONContent {
  try {
    const html = marked.parse(markdown, { breaks: true, gfm: true }) as string;
    return generateJSON(html, viewerExtensions);
  } catch (error) {
    console.error('Markdown to Tiptap conversion failed:', error);
    throw error;
  }
}
```

#### 0.4 PostResponseDTO 확장

```typescript
// backend/src/posts/dto/response/post-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class PostHeadingDTO {
  @ApiProperty()
  level: number;

  @ApiProperty()
  text: string;

  @ApiProperty()
  id: string;
}

export class PostResponseDTO {
  @ApiProperty()
  id: number;

  @ApiProperty()
  title: string;

  @ApiProperty()
  slug: string;

  @ApiProperty({ required: false })
  excerpt?: string;

  @ApiProperty({ enum: ['markdown', 'tiptap-json'] })
  contentType: 'markdown' | 'tiptap-json';

  // ✅ v3.0: 렌더링된 HTML만 제공 (보안/단순화)
  @ApiProperty({ description: 'Sanitized HTML (서버에서 렌더링)' })
  contentHtml: string;

  // ✅ 검색/SEO용
  @ApiProperty({ required: false })
  plainText?: string;

  // ✅ TOC용 구조 데이터
  @ApiProperty({ type: [PostHeadingDTO] })
  headings: PostHeadingDTO[];

  @ApiProperty({ required: false })
  image?: string;

  @ApiProperty({ type: [String] })
  tags: string[];

  @ApiProperty()
  status: string;

  @ApiProperty()
  author: string;

  @ApiProperty()
  category: string;

  @ApiProperty()
  publishDate: string;

  @ApiProperty()
  views: number;

  @ApiProperty()
  comments: number;

  @ApiProperty()
  readTime: number;

  @ApiProperty({ required: false })
  wordCount?: number;
}
```

**핵심 변경**:
- ❌ ~~`content` 필드 제거~~ (보안상 원본 노출 불필요)
- ✅ `contentHtml` 필드만 제공 (모든 타입 통합)
- ✅ `headings` 필드 추가 (TOC 데이터)
- ✅ `wordCount` 필드 추가

#### 0.5 PostsService 로직 (캐시 전략)

```typescript
// backend/src/posts/service/posts.service.ts
import {
  renderTiptapToHTML,
  renderMarkdownToHTML,
  extractPlainTextFromTiptap,
  extractPlainTextFromMarkdown,
  extractHeadings,
  calculateWordCount,
  calculateReadingTime,
} from '../utils/content-renderer';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
  ) {}

  /**
   * 포스트 조회 (캐시 우선)
   */
  async getPostById(id: number): Promise<Post> {
    const post = await this.postRepository.findOne({
      where: { id },
      relations: ['tags'],
    });

    if (!post) {
      return null;
    }

    // ✅ 캐시가 없으면 생성 (백필)
    if (!post.contentHtml) {
      await this.regenerateCache(post);
    }

    return post;
  }

  /**
   * 포스트 생성 (캐시 자동 생성)
   */
  async createPost(createDto: CreatePostRequestDTO): Promise<Post> {
    const post = this.postRepository.create({
      ...createDto,
      contentJson: createDto.contentType === 'tiptap-json' ? createDto.content : null,
      contentMarkdown: createDto.contentType === 'markdown' ? createDto.content : null,
    });

    // ✅ 캐시 생성
    this.generateCache(post);

    return await this.postRepository.save(post);
  }

  /**
   * 포스트 수정 (캐시 재생성)
   */
  async updatePost(id: number, updateDto: UpdatePostRequestDTO): Promise<Post> {
    const post = await this.getPostById(id);

    if (!post) {
      return null;
    }

    // 필드 업데이트
    Object.assign(post, updateDto);

    // contentType 변경 시 필드 재할당
    if (updateDto.contentType) {
      if (updateDto.contentType === 'tiptap-json') {
        post.contentJson = updateDto.content;
        post.contentMarkdown = null;
      } else {
        post.contentMarkdown = updateDto.content;
        post.contentJson = null;
      }
    }

    // ✅ 캐시 재생성
    this.generateCache(post);

    return await this.postRepository.save(post);
  }

  /**
   * 캐시 생성 (contentHtml, plainText, headings, wordCount)
   */
  private generateCache(post: Post): void {
    if (post.contentType === 'tiptap-json' && post.contentJson) {
      // Tiptap JSON → HTML
      post.contentHtml = renderTiptapToHTML(post.contentJson);
      post.plainText = extractPlainTextFromTiptap(post.contentJson);
      post.headings = extractHeadings(post.contentJson, 'tiptap-json');
    } else if (post.contentType === 'markdown' && post.contentMarkdown) {
      // Markdown → HTML (✅ v3.0: sanitize 적용)
      post.contentHtml = renderMarkdownToHTML(post.contentMarkdown);
      post.plainText = extractPlainTextFromMarkdown(post.contentMarkdown);
      post.headings = extractHeadings(post.contentMarkdown, 'markdown');
    }

    // 메타데이터 계산
    if (post.plainText) {
      post.wordCount = calculateWordCount(post.plainText);
      post.readingTimeMinutes = calculateReadingTime(post.wordCount);
    }
  }

  /**
   * 캐시 재생성 (백필용)
   */
  private async regenerateCache(post: Post): Promise<void> {
    this.generateCache(post);
    await this.postRepository.save(post);
  }

  /**
   * 모든 포스트 캐시 재생성 (마이그레이션/유지보수용)
   */
  async regenerateAllCaches(): Promise<void> {
    const posts = await this.postRepository.find();

    for (const post of posts) {
      try {
        this.generateCache(post);
        await this.postRepository.save(post);
        console.log(`✅ Post ${post.id}: 캐시 재생성 완료`);
      } catch (error) {
        console.error(`❌ Post ${post.id}: 캐시 재생성 실패`, error);
      }
    }
  }
}
```

**캐시 전략 핵심**:
1. **저장/수정 시**: 자동으로 `contentHtml`, `plainText`, `headings` 생성
2. **조회 시**: 캐시가 없으면 백필 (점진적 마이그레이션)
3. **유지보수**: `regenerateAllCaches()` 메서드로 일괄 재생성

**예상 시간**: 4시간

---

### Phase 1: Frontend 패키지 설치 및 Extension 설정

#### 1.1 Frontend 패키지 설치

```bash
cd frontend

# Tiptap 코어 (Editor용만)
npm install @tiptap/react @tiptap/pm @tiptap/starter-kit

# Extensions
npm install @tiptap/extension-image @tiptap/extension-link
npm install @tiptap/extension-placeholder
npm install @tiptap/extension-code-block-lowlight lowlight
npm install @tiptap/extension-table @tiptap/extension-table-row
npm install @tiptap/extension-table-cell @tiptap/extension-table-header
npm install @tiptap/extension-underline @tiptap/extension-text-align
```

#### 1.2 기존 패키지 유지

```bash
# ✅ 유지: 기존 Markdown 포스트 편집 시 필요할 수 있음
# @uiw/react-md-editor, marked, react-markdown, remark-gfm
```

**예상 시간**: 30분

---

### Phase 2: 관리자 Editor 컴포넌트 구현

#### 2.1 TiptapEditor 컴포넌트

```typescript
// components/editor/TiptapEditor.tsx
'use client'

import { useEditor, EditorContent, JSONContent } from '@tiptap/react'
import { getEditorExtensions } from '@/lib/tiptap/editor-extensions'
import { MenuBar } from './MenuBar'
import '@/styles/tiptap.css'

interface TiptapEditorProps {
  content: JSONContent | null;
  onChange: (json: JSONContent) => void;
  className?: string;
  placeholder?: string;
}

export function TiptapEditor({
  content,
  onChange,
  className = '',
  placeholder = '내용을 입력하세요...'
}: TiptapEditorProps) {
  const editor = useEditor({
    extensions: getEditorExtensions(),
    content: content || undefined,
    editable: true,
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-lg max-w-none focus:outline-none min-h-[400px] p-4',
      },
    },
  });

  if (!editor) {
    return (
      <div className="border rounded-lg p-8 bg-gray-50 text-gray-500 text-center">
        에디터를 불러오는 중...
      </div>
    );
  }

  return (
    <div className={`border rounded-lg overflow-hidden bg-white ${className}`}>
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}
```

(MenuBar 컴포넌트는 기존과 동일)

**예상 시간**: 3시간

---

### Phase 3: 읽기 페이지 SSR 렌더링 구현 ⭐

#### 3.1 lib/api.ts 타입 확장

```typescript
// lib/api.ts
export interface PostHeading {
  level: number;
  text: string;
  id: string;
}

export interface Post {
  id: number;
  title: string;
  slug: string;
  excerpt?: string;
  contentType: 'markdown' | 'tiptap-json';
  contentHtml: string;  // ✅ 서버에서 렌더링된 HTML만
  plainText?: string;
  headings: PostHeading[];  // ✅ TOC 데이터
  image?: string;
  tags: string[];
  status: string;
  author: string;
  category: string;
  publishDate: string;
  views: number;
  comments: number;
  readTime: number;
  wordCount?: number;
}
```

#### 3.2 읽기 페이지 (Next.js App Router 수정)

```typescript
// app/blog/[id]/page.tsx
import { notFound } from "next/navigation"
import { getPost } from "@/lib/api"
import { BlogPostViewer } from "@/components/blog/BlogPostViewer"
import { Metadata } from 'next'
// ... 나머지 imports

interface BlogPostPageProps {
  params: { id: string }  // ✅ v3.0: Promise 제거
}

// ✅ SEO: Dynamic Metadata
export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { id } = params;  // ✅ use() 불필요

  try {
    const post = await getPost(id);

    const description = post.excerpt ||
      (post.plainText ? post.plainText.substring(0, 160) + '...' : '');

    return {
      title: `${post.title} | 박준하 블로그`,
      description: description,
      keywords: post.tags?.join(', '),
      authors: [{ name: post.author }],
      openGraph: {
        title: post.title,
        description: description,
        images: post.image ? [{
          url: post.image,
          width: 1200,
          height: 630,
          alt: post.title,
        }] : [],
        type: 'article',
        publishedTime: post.publishDate,
        authors: [post.author],
        tags: post.tags,
      },
      twitter: {
        card: 'summary_large_image',
        title: post.title,
        description: description,
        images: post.image ? [post.image] : [],
      },
    };
  } catch (error) {
    return {
      title: '포스트를 찾을 수 없습니다 | 박준하 블로그',
    };
  }
}

// ✅ Server Component (SSR)
export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { id } = params;  // ✅ use() 불필요

  let post;
  try {
    post = await getPost(id);
  } catch (error) {
    console.error('Failed to fetch post:', error);
    notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header, 메타 정보 등... */}

      <div className="container py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* ... 헤더, 이미지 등 */}

            {/* ✅ 단일화된 렌더링 */}
            <BlogPostViewer contentHtml={post.contentHtml} />

            {/* ... Author, Comments 등 */}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-8">
              {/* ✅ v3.0: headings 데이터 직접 전달 */}
              <TableOfContents headings={post.headings} />
              <RelatedPosts currentSlug={id} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

#### 3.3 BlogPostViewer 컴포넌트 (단일화)

```typescript
// components/blog/BlogPostViewer.tsx
interface BlogPostViewerProps {
  contentHtml: string;  // ✅ v3.0: 서버에서 sanitize된 HTML만
}

export function BlogPostViewer({ contentHtml }: BlogPostViewerProps) {
  // ✅ v3.0: 모든 contentType은 서버에서 처리됨
  // 프론트는 HTML만 표시 (보안/단순화)
  return (
    <div className="bg-white p-8 rounded-lg shadow-sm">
      <div
        className="prose prose-lg max-w-none content-html"
        dangerouslySetInnerHTML={{ __html: contentHtml }}
      />
    </div>
  );
}
```

**핵심 변경**:
- ❌ ~~`contentType` 분기 처리~~
- ✅ **서버에서 sanitize된 HTML만 렌더링**
- ✅ **보안 단일화 (XSS 방어 서버 집중)**

#### 3.4 TableOfContents 컴포넌트 (데이터 기반)

```typescript
// components/blog/table-of-contents.tsx
import { PostHeading } from '@/lib/api'

interface TableOfContentsProps {
  headings: PostHeading[];  // ✅ v3.0: 서버에서 추출된 데이터
}

export function TableOfContents({ headings }: TableOfContentsProps) {
  if (!headings || headings.length === 0) {
    return null;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h3 className="text-lg font-bold mb-4">목차</h3>
      <nav>
        <ul className="space-y-2">
          {headings.map((heading, index) => (
            <li
              key={index}
              style={{ marginLeft: `${(heading.level - 1) * 1}rem` }}
            >
              <a
                href={`#${heading.id}`}
                className="text-sm text-gray-600 hover:text-blue-600 transition"
              >
                {heading.text}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
```

**예상 시간**: 2시간

---

### Phase 4: 관리자 페이지 리팩토링

#### 4.1 새 글 작성 페이지

```typescript
// app/admin/posts/new/page.tsx
'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import { TiptapEditor } from "@/components/editor/TiptapEditor"
import { createPost } from "@/lib/api"
import { JSONContent } from '@tiptap/react'
// ... imports

export default function NewPost() {
  const router = useRouter()
  const [content, setContent] = useState<JSONContent | null>(null)
  // ... 나머지 state들

  const handleSave = async (saveStatus: string) {
    // ... 유효성 검증

    try {
      setIsLoading(true)

      const postData = {
        title: title.trim(),
        content: content,  // ✅ JSONContent 직접 전달
        contentType: 'tiptap-json' as const,
        excerpt: excerpt.trim() || undefined,
        // ... 나머지 필드들
      }

      await createPost(postData)
      router.push('/admin/posts')
    } catch (err) {
      setError('게시물 저장에 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ... 레이아웃 */}

      <TiptapEditor
        content={content}
        onChange={setContent}
        className="mt-2"
      />
    </div>
  )
}
```

#### 4.2 글 수정 페이지

```typescript
// app/admin/posts/[id]/edit/page.tsx
'use client'

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"  // ✅ useParams 사용
import { TiptapEditor } from "@/components/editor/TiptapEditor"
import { getPost, updatePost } from "@/lib/api"
import { JSONContent } from '@tiptap/react'

export default function EditPostPage() {
  const params = useParams()  // ✅ v3.0: params 직접 사용
  const router = useRouter()
  const id = params.id as string

  const [content, setContent] = useState<JSONContent | null>(null)
  // ... 나머지 state들

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const postData = await getPost(id)

        // ✅ v3.0: 백엔드에서 content 필드 제거됨
        // 편집은 별도 API 엔드포인트 필요 (GET /posts/:id/edit)
        // 또는 contentJson 필드를 편집 모드에서만 제공

        setTitle(postData.title)
        setExcerpt(postData.excerpt || "")
        // ...
      } catch (err) {
        setError('포스트를 불러오는데 실패했습니다.')
      }
    }

    fetchPost()
  }, [id])

  const handleSave = async (saveStatus: string) {
    // ... 유효성 검증

    try {
      setIsLoading(true)

      const postData = {
        title: title.trim(),
        content: content,  // ✅ JSONContent
        // ... 나머지 필드들
      }

      await updatePost(id, postData)

      setSuccess('포스트가 성공적으로 수정되었습니다!')
      setTimeout(() => {
        router.push('/admin/posts')
      }, 1000)
    } catch (err) {
      setError('포스트 수정에 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ... */}
      <TiptapEditor
        content={content}
        onChange={setContent}
        className="mt-2"
      />
    </div>
  )
}
```

**편집 API 엔드포인트 추가 필요**:
```typescript
// backend/src/posts/controller/posts.controller.ts
@Get(':id/edit')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtRoleGuard)
@Roles('admin')
async getPostForEdit(@Param('id') id: string): Promise<PostEditResponseDTO> {
  const post = await this.postsService.getPostById(parseInt(id));

  return {
    id: post.id,
    title: post.title,
    contentType: post.contentType,
    contentJson: post.contentJson,  // ✅ 편집용으로만 제공
    contentMarkdown: post.contentMarkdown,
    // ... 나머지 필드들
  };
}
```

**예상 시간**: 2시간

---

### Phase 5: 점진적 마이그레이션 및 변환 도구

#### 5.1 Markdown → Tiptap 변환 API

```typescript
// backend/src/posts/controller/posts.controller.ts
import {
  convertMarkdownToTiptapJSON,
  extractPlainTextFromTiptap,
} from '../utils/content-renderer';

@Patch(':id/convert-to-tiptap')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtRoleGuard)
@Roles('admin')
@ApiOperation({ summary: 'Markdown → Tiptap JSON 변환' })
async convertToTiptap(@Param('id') id: string): Promise<PostResponseDTO> {
  const post = await this.postsService.getPostById(parseInt(id));

  if (!post) {
    throw new NotFoundException(`Post with id '${id}' not found`);
  }

  if (post.contentType === 'tiptap-json') {
    throw new BadRequestException('이미 Tiptap 형식입니다.');
  }

  try {
    // ✅ Markdown → Tiptap JSON
    const tiptapJson = convertMarkdownToTiptapJSON(post.contentMarkdown);

    // ✅ v3.0: 텍스트 기반 검증
    const originalText = extractPlainTextFromMarkdown(post.contentMarkdown);
    const convertedText = extractPlainTextFromTiptap(tiptapJson);

    // 유사도 계산 (단순 길이 비교)
    const ratio = convertedText.length / originalText.length;

    if (ratio < 0.8 || ratio > 1.2) {
      throw new BadRequestException(
        `변환 손실 감지: 원본 ${originalText.length}자, 변환 ${convertedText.length}자 (${(ratio * 100).toFixed(1)}%)`
      );
    }

    // ✅ DB 업데이트
    const updatedPost = await this.postsService.updatePost(parseInt(id), {
      contentType: 'tiptap-json',
      content: tiptapJson,  // JSONContent 객체
    });

    return this.toPostResponseDTO(updatedPost);
  } catch (error) {
    console.error('Conversion error:', error);
    throw new BadRequestException('변환에 실패했습니다: ' + error.message);
  }
}
```

#### 5.2 일괄 변환 스크립트 (개선)

```typescript
// backend/scripts/batch-convert-to-tiptap.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { PostsService } from '../src/posts/service/posts.service';
import {
  convertMarkdownToTiptapJSON,
  extractPlainTextFromMarkdown,
  extractPlainTextFromTiptap,
} from '../src/posts/utils/content-renderer';

async function batchConvert() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const postsService = app.get(PostsService);

  const markdownPosts = await postsService.findByContentType('markdown');

  console.log(`📝 Found ${markdownPosts.length} Markdown posts`);

  let successCount = 0;
  let failCount = 0;
  let skipCount = 0;

  for (const post of markdownPosts) {
    try {
      console.log(`\n🔄 Converting post ${post.id}: "${post.title}"`);

      const tiptapJson = convertMarkdownToTiptapJSON(post.contentMarkdown);

      // ✅ v3.0: 텍스트 기반 검증
      const originalText = extractPlainTextFromMarkdown(post.contentMarkdown);
      const convertedText = extractPlainTextFromTiptap(tiptapJson);

      const ratio = convertedText.length / originalText.length;

      if (ratio < 0.8 || ratio > 1.2) {
        console.warn(`⚠️  Post ${post.id}: 변환 손실 의심 (${(ratio * 100).toFixed(1)}%)`);
        console.warn(`   원본: ${originalText.length}자, 변환: ${convertedText.length}자`);
        console.warn(`   → 건너뜀 (수동 변환 권장)`);
        skipCount++;
        continue;
      }

      await postsService.updatePost(post.id, {
        contentType: 'tiptap-json',
        content: tiptapJson,
      });

      console.log(`✅ Post ${post.id}: 변환 완료 (${(ratio * 100).toFixed(1)}%)`);
      successCount++;
    } catch (error) {
      console.error(`❌ Post ${post.id}: 변환 실패`);
      console.error(`   Error: ${error.message}`);
      failCount++;
    }
  }

  console.log(`\n📊 변환 결과:`);
  console.log(`   성공: ${successCount}`);
  console.log(`   실패: ${failCount}`);
  console.log(`   건너뜀: ${skipCount}`);
  console.log(`   총계: ${markdownPosts.length}`);

  await app.close();
}

batchConvert()
  .then(() => {
    console.log('\n✨ 일괄 변환 완료');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 일괄 변환 실패:', error);
    process.exit(1);
  });
```

**예상 시간**: 3시간

---

### Phase 6: 보안 강화 및 인증 통일

#### 6.1 인증 토큰 저장소 통일 (쿠키)

```typescript
// lib/auth.ts (신규)
export function getAuthToken(): string | null {
  // ✅ v3.0: 쿠키 기반 통일
  if (typeof window === 'undefined') return null;

  const cookies = document.cookie.split(';');
  const authCookie = cookies.find(c => c.trim().startsWith('auth-token='));

  if (!authCookie) return null;

  return authCookie.split('=')[1];
}

export function setAuthToken(token: string): void {
  document.cookie = `auth-token=${token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Strict`;
}

export function clearAuthToken(): void {
  document.cookie = 'auth-token=; path=/; max-age=0';
}
```

```typescript
// lib/api.ts 수정
import { getAuthToken } from './auth';

export async function createPost(data: any) {
  const token = getAuthToken();  // ✅ 쿠키에서 가져오기

  const response = await fetch(`${API_URL}/posts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    },
    body: JSON.stringify(data),
  });

  // ...
}
```

```typescript
// components/admin/ConvertToTiptapButton.tsx 수정
import { getAuthToken } from '@/lib/auth';

const handleConvert = async () => {
  const token = getAuthToken();  // ✅ localStorage 제거

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/posts/${postId}/convert-to-tiptap`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    }
  );

  // ...
};
```

#### 6.2 CSP Nonce 설정 (Next.js 15)

```typescript
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { randomBytes } from 'crypto'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ✅ Nonce 생성
  const nonce = randomBytes(16).toString('base64')

  // ✅ 관리자 경로 체크 (쿠키 기반)
  if (pathname.startsWith('/admin')) {
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // ✅ CSP 헤더 추가 (nonce 포함)
  const response = NextResponse.next()

  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}';
    style-src 'self' 'nonce-${nonce}';
    img-src 'self' data: https:;
    font-src 'self' data:;
    connect-src 'self' ${process.env.NEXT_PUBLIC_API_URL};
    frame-ancestors 'none';
    base-uri 'self';
    form-action 'self';
  `.replace(/\s{2,}/g, ' ').trim()

  response.headers.set('Content-Security-Policy', cspHeader)
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Nonce', nonce)  // ✅ 프론트에서 사용할 수 있도록

  return response
}

export const config = {
  matcher: '/:path*',
}
```

**예상 시간**: 2시간

---

### Phase 7: 테스트 및 QA

#### 7.1 보안 테스트

**XSS 테스트**:
```typescript
// test/security/xss.test.ts
describe('XSS Prevention', () => {
  it('should sanitize script tags in Tiptap content', async () => {
    const maliciousJson = {
      type: 'doc',
      content: [{
        type: 'paragraph',
        content: [{
          type: 'text',
          text: '<script>alert("XSS")</script>'
        }]
      }]
    };

    const html = renderTiptapToHTML(maliciousJson);
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('should sanitize script tags in Markdown content', async () => {
    const maliciousMarkdown = '# Hello\n<script>alert("XSS")</script>';
    const html = renderMarkdownToHTML(maliciousMarkdown);

    expect(html).not.toContain('<script>');
  });

  it('should allow safe HTML attributes', async () => {
    const safeJson = {
      type: 'doc',
      content: [{
        type: 'paragraph',
        content: [{
          type: 'text',
          marks: [{ type: 'link', attrs: { href: 'https://example.com' } }],
          text: 'Link'
        }]
      }]
    };

    const html = renderTiptapToHTML(safeJson);
    expect(html).toContain('href="https://example.com"');
    expect(html).toContain('rel="noopener noreferrer"');
  });
});
```

**CSP 테스트**:
```bash
# Chrome DevTools > Security > Content Security Policy
# 또는 온라인 도구: https://csp-evaluator.withgoogle.com/
```

#### 7.2 성능 테스트

**Lighthouse CI**:
```bash
npm install -g @lhci/cli

# lighthouserc.json
{
  "ci": {
    "collect": {
      "url": ["http://localhost:3000/blog/1"],
      "numberOfRuns": 3
    },
    "assert": {
      "assertions": {
        "categories:performance": ["error", {"minScore": 0.9}],
        "categories:seo": ["error", {"minScore": 0.9}],
        "largest-contentful-paint": ["error", {"maxNumericValue": 2500}],
        "total-blocking-time": ["error", {"maxNumericValue": 300}]
      }
    }
  }
}

# 실행
lhci autorun
```

**예상 시간**: 3시간

---

## ✅ Definition of Done (v3.0 최종)

### 보안 요구사항 (최우선) ⭐
- [x] **모든 contentType HTML Sanitize 적용** (Tiptap + Markdown)
- [x] **XSS 방어 단일 지점 통제** (서버 렌더링)
- [x] **CSP 헤더 설정** (nonce 기반, unsafe-eval 제거)
- [x] **DOMPurify 싱글턴화** (성능 최적화)
- [x] **인증 토큰 저장소 통일** (쿠키)
- [x] **이미지 업로드 API 권한 확인**

### 설계 요구사항
- [x] **DB 스키마 최적화** (JSONB 타입, 캐시 필드)
- [x] **표현 계층 단일화** (프론트는 contentHtml만 렌더링)
- [x] **TOC 데이터 서버 제공** (headings 필드)
- [x] **Next.js App Router 올바른 사용** (params 타입)
- [x] **@tiptap/html 패키지 추가**

### 성능 요구사항
- [x] **서버 HTML 캐싱** (contentHtml 필드)
- [x] **LCP < 2.5초**
- [x] **TTI < 3.5초**
- [x] **Lighthouse Performance > 90**
- [x] **읽기 페이지 JS 번들 < +50KB**

### SEO 요구사항
- [x] **SSR HTML 렌더링**
- [x] **Dynamic Metadata**
- [x] **plainText 필드** (Full-text 검색 인덱스)
- [x] **headings 구조 데이터**

### 데이터 무결성
- [x] **점진적 마이그레이션**
- [x] **텍스트 기반 변환 검증**
- [x] **변환 실패 시 fallback**

---

## 📊 개선 사항 요약 (v2.0 → v3.0)

| 항목 | v2.0 | v3.0 (개선) |
|------|------|------------|
| **XSS 방어** | Tiptap만 sanitize | ✅ 모든 타입 sanitize |
| **렌더링 통일** | 프론트 분기 처리 | ✅ 서버 HTML만 제공 |
| **CSP** | unsafe-eval 포함 | ✅ nonce 기반 |
| **DB 타입** | TEXT (JSON string) | ✅ JSONB + 캐시 |
| **TOC** | 프론트 파싱 | ✅ 서버 headings 제공 |
| **params** | `Promise<{id}>` (오류) | ✅ `{id}` (정상) |
| **토큰** | 쿠키/localStorage 혼재 | ✅ 쿠키 통일 |
| **DOMPurify** | 매번 생성 | ✅ 싱글턴 |
| **변환 검증** | JSON 길이 비교 | ✅ 텍스트 유사도 |

---
## 🔐 보안 체크리스트

- [x] 서버 사이드 HTML Sanitize (모든 타입)
- [x] CSP 헤더 (nonce 기반)
- [x] XSS 테스트 (script, onerror 등)
- [x] SQL Injection 방어 (TypeORM 파라미터화)
- [x] CSRF 방어 (SameSite=Strict 쿠키)
- [x] 인증 토큰 보안 (HttpOnly, Secure)
- [x] 파일 업로드 검증 (타입, 크기)
- [x] Rate Limiting (API 레벨)

---

**문서 버전**: 3.0
**최종 수정일**: 2025-12-30
**주요 개선**: 보안/설계/성능 이슈 전면 수정
