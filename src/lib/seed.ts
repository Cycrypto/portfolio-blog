import type { Post, Series } from "./types";
const cover =
  "https://images.unsplash.com/photo-1580152216273-81250489f69f?auto=format&fit=crop&w=1440&q=85";
const architecture =
  "https://images.unsplash.com/photo-1615637192962-635155ec7c49?auto=format&fit=crop&w=640&q=80";
const now = "2026-10-14T03:30:00.000Z";
export const seedSeries: Series[] = [
  {
    id: "series-building-blog",
    name: "블로그를 만드는 과정",
    slug: "building-a-blog",
    description:
      "기획부터 디자인, Markdown 렌더링과 발행까지. 직접 블로그를 만드는 과정을 차례대로 기록합니다.",
    createdAt: now,
    updatedAt: now,
    revision: 1,
  },
];
const firstBody = `## 공통 언어에서 시작하기

디자인 시스템은 반복되는 선택을 줄여줍니다. 읽기 화면과 편집 화면이 같은 규칙을 공유하면, 새로운 글도 자연스럽게 같은 리듬으로 이어집니다.

> 좋은 기록은 결과뿐 아니라 그 결과를 만든 선택도 남깁니다.

## 토큰과 컴포넌트

색상과 글꼴, 간격을 토큰으로 정의하고 반복되는 UI를 컴포넌트로 묶었습니다. 각 화면이 같은 선택을 공유하면 변경도 자연스럽게 이어집니다.

- **색상**: 크림 배경, 짙은 갈색 텍스트, 코랄 포인트
- **글꼴**: 세리프 제목과 편하게 읽히는 본문
- **간격**: 4px 기반의 일관된 여백

\`\`\`typescript
const posts = await getPosts({
  status: "published",
  series: "building-a-blog"
});

return posts.sort((a, b) => a.order - b.order);
\`\`\`

| 요소 | 역할 | 본문 규칙 |
| --- | --- | --- |
| 제목 | 문서 구조 | H2 → H3 |
| 이미지 | 시각 자료 | 대체 텍스트 + 캡션 |
| 코드 | 예제 표현 | 언어 + 복사 |

## 실제 화면에 적용하기

목록에서는 제목과 요약을 먼저 읽고, 상세 화면에서는 본문에 집중할 수 있도록 구성했습니다. 작성 화면의 미리보기에도 같은 본문 스타일을 적용합니다.

![자연광이 드는 콘크리트 구조물](${cover} "반복되는 형태 사이에서 찾은 작은 리듬.")

### 다음 기록을 위한 준비

- [x] 공통 컴포넌트 정리
- [x] Markdown과 이미지 렌더링
- [ ] 더 많은 이야기를 기록하기

작은 시스템은 다음 작업을 조금 더 가볍게 만듭니다. [시리즈 전체 보기](/series/building-a-blog)에서 앞뒤 기록을 이어 읽어보세요.
`;
export const seedPosts: Post[] = [
  [
    "post-structure",
    "블로그의 구조 설계하기",
    "blog-structure",
    "어떤 기록을 어떻게 담을지 정리했습니다.",
    0,
    "2026-10-06",
    `## 어떤 글을 담을까요?\n\n만드는 과정과 배운 것들을 한곳에 모으고 싶었습니다. 포트폴리오와 블로그가 같은 언어를 사용하도록 구조를 잡았습니다.\n\n## 기록의 단위\n\n- 게시글은 하나의 생각을 담습니다.\n- 시리즈는 여러 글을 순서대로 연결합니다.\n- 태그는 다양한 주제를 가로질러 글을 찾아줍니다.\n\n> 작게 시작하되, 다음 기록을 위한 자리를 남겨두세요.`,
  ],
  [
    "post-design",
    "작은 디자인 시스템에서 시작하기",
    "design-system-notes",
    "반복되는 UI를 찾고, 공통의 언어를 만들어가는 과정에 대한 기록.",
    1,
    "2026-10-14",
    firstBody,
  ],
  [
    "post-markdown",
    "Markdown과 사진이 함께 읽히는 글",
    "markdown-images",
    "본문 렌더링부터 이미지 표시까지, 읽기 경험을 정리합니다.",
    2,
    "2026-10-10",
    `## 글의 리듬\n\n문단, 코드, 사진이 각각의 역할을 갖도록 표현합니다. **중요한 부분**과 *작은 강조*, ~~지난 생각~~도 기록할 수 있습니다.\n\n## 사진과 맥락\n\n![콘크리트 구조물과 자연광](${cover} "사진은 글의 맥락을 더합니다.")\n\n## 코드 예제\n\n\`\`\`javascript\nconst note = { title: '기록하기', published: true };\nconsole.log(note);\n\`\`\`\n\n본문 사진을 누르면 확대할 수 있고, 코드의 복사 버튼으로 예제를 가져갈 수 있습니다.`,
  ],
  [
    "post-images",
    "사진 업로드와 이미지 최적화",
    "image-upload",
    "사진을 담는 흐름과 표시 규칙을 다듬습니다.",
    3,
    "2026-10-11",
    "## 이미지를 위한 흐름\n\n파일 선택 → 대체 텍스트 → 캡션 → 본문에 삽입.\n\n본문 이미지는 원본의 비율을 유지하고, 대표 이미지는 16:9로 표시합니다.",
  ],
  [
    "post-publish",
    "게시글 저장과 발행 흐름",
    "publishing-flow",
    "작성부터 공개까지 안전하게 연결합니다.",
    4,
    "2026-10-12",
    "## 기록을 공개하기\n\n임시 저장은 생각을 지키고, 미리보기는 읽기 경험을 확인합니다. 발행 전 제목과 주소, 공개 범위를 확인하세요.",
  ],
  [
    "post-weekly",
    "한 주의 기록을 남기는 방법",
    "weekly-notes",
    "생각이 흩어지기 전에 작고 선명한 문장으로 남깁니다.",
    null,
    "2026-10-01",
    "## 이번 주에 배운 것\n\n큰 결과만 기록할 필요는 없습니다. 작은 선택과 예상 밖의 발견도 다음 작업에 도움이 됩니다.\n\n1. 기억에 남는 순간을 적습니다.\n2. 선택한 이유를 덧붙입니다.\n3. 다음에 시도할 것을 남깁니다.",
  ],
  [
    "post-draft",
    "새 글을 위한 아이디어 모음",
    "ideas-for-next-post",
    "다음에 기록하고 싶은 생각들입니다.",
    null,
    "2026-10-13",
    "## 다음 기록\n\n- 더 편안한 작성 흐름\n- 작은 제품을 오래 유지하는 방법",
  ],
].map(([id, title, slug, excerpt, order, date, body], index) => ({
  id: String(id),
  title: String(title),
  slug: String(slug),
  excerpt: String(excerpt),
  bodyMarkdown: String(body),
  coverUrl:
    index === 6 ? "" : index === 1 || index === 2 ? cover : architecture,
  coverAlt: index === 6 ? "" : "자연광과 콘크리트 건축물",
  tags: index === 5 ? ["일상", "기록"] : ["개발", "블로그"],
  status: index === 6 ? "draft" : "published",
  visibility: "public",
  seriesId: order === null ? null : "series-building-blog",
  seriesOrder: order === null ? null : Number(order),
  createdAt: `${date}T03:30:00.000Z`,
  updatedAt: `${date}T03:30:00.000Z`,
  publishedAt: index === 6 ? null : `${date}T03:30:00.000Z`,
  revision: 1,
}));
