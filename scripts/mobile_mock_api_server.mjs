import http from 'node:http';

const HOST = process.env.MOCK_HOST || '127.0.0.1';
const PORT = Number(process.env.MOCK_PORT || 3002);

const profile = {
  name: '박준하',
  title: '백엔드 개발자',
  subtitle: '문제를 구조화하고 안정적인 백엔드 시스템을 설계하는 개발자입니다.',
  email: 'junha@example.com',
  location: '서울, 대한민국',
  status: '이직 및 협업 가능',
  statusMessage: '백엔드 플랫폼과 생산성 도구를 만드는 일을 선호합니다.',
  github: 'https://github.com/cycrypto',
  linkedin: 'https://www.linkedin.com/in/cycrypto/',
  about:
    '운영 환경에서 오래 버티는 백엔드 시스템과 관리 도구를 설계하고 구현해왔습니다. 최근에는 포트폴리오를 제품처럼 다듬는 작업에 집중하고 있습니다.',
  description:
    '복잡한 문제를 빠르게 구조화하고, 장애 대응과 운영 자동화까지 고려한 설계를 선호합니다.',
  skills: [
    { name: 'Java', level: 95 },
    { name: 'Spring Boot', level: 92 },
    { name: 'NestJS', level: 88 },
    { name: 'TypeScript', level: 86 },
    { name: 'PostgreSQL', level: 84 },
    { name: 'Redis', level: 82 },
    { name: 'Docker', level: 83 },
    { name: 'AWS', level: 80 },
  ],
  profileImage: '',
  isAvailable: true,
  showStatus: true,
};

const posts = [
  {
    id: 101,
    title: 'NestJS 인증 경계를 단순화해 401 원인을 빨리 좁힌 방법',
    slug: 'nestjs-auth-boundary-debugging',
    excerpt: 'AuthGuard, 인터셉터, 토큰 파싱 흐름을 분리해 원인을 추적한 기록입니다.',
    category: 'NestJS',
    publishDate: '2026-03-20T09:00:00.000Z',
    readTime: 8,
    status: 'published',
    tags: ['NestJS', 'JWT', 'Debugging'],
    image: '',
    likes: 19,
    views: 412,
    isFeatured: true,
    featuredOrder: 1,
  },
  {
    id: 102,
    title: '포트폴리오 관리자 UI를 운영도구처럼 다듬기 위한 기준',
    slug: 'portfolio-admin-ui-criteria',
    excerpt: '콘텐츠 관리 화면을 CRUD 목록이 아니라 실제 운영 도구로 재구성한 기준입니다.',
    category: 'Frontend',
    publishDate: '2026-03-18T09:00:00.000Z',
    readTime: 6,
    status: 'published',
    tags: ['UX', 'Admin', 'Next.js'],
    image: '',
    likes: 14,
    views: 355,
    isFeatured: true,
    featuredOrder: 2,
  },
  {
    id: 103,
    title: 'Redis 기반 캐시 무효화 전략을 서비스 경계에 맞춘 이유',
    slug: 'redis-cache-invalidation-strategy',
    excerpt: '캐시 키를 화면 단위가 아니라 도메인 이벤트 단위로 정리한 사례입니다.',
    category: 'Backend',
    publishDate: '2026-03-15T09:00:00.000Z',
    readTime: 7,
    status: 'published',
    tags: ['Redis', 'Caching', 'Architecture'],
    image: '',
    likes: 11,
    views: 298,
    isFeatured: true,
    featuredOrder: 3,
  },
  {
    id: 104,
    title: 'Next.js 랜딩 페이지에서 긴 스크롤을 견디게 만드는 정보 밀도 조정',
    slug: 'nextjs-long-scroll-density',
    excerpt: '섹션 간격, 카드 수, CTA 분포를 다시 잡아 이탈을 줄인 실험입니다.',
    category: 'Next.js',
    publishDate: '2026-03-12T09:00:00.000Z',
    readTime: 5,
    status: 'published',
    tags: ['Next.js', 'UX', 'Mobile'],
    image: '',
    likes: 9,
    views: 266,
    isFeatured: false,
    featuredOrder: 0,
  },
  {
    id: 105,
    title: '실시간 댓글 스팸 차단을 레이트리밋보다 넓게 본 이유',
    slug: 'comment-spam-defense',
    excerpt: '속도 제한 외에 휴리스틱과 운영 플로우를 함께 설계한 기록입니다.',
    category: 'Security',
    publishDate: '2026-03-10T09:00:00.000Z',
    readTime: 9,
    status: 'published',
    tags: ['Security', 'Comments', 'Moderation'],
    image: '',
    likes: 13,
    views: 251,
    isFeatured: false,
    featuredOrder: 0,
  },
  {
    id: 106,
    title: '프로젝트와 기술 글을 연결해 포트폴리오를 탐색형으로 만든 구조',
    slug: 'portfolio-project-post-linking',
    excerpt: '프로젝트 상세보다 구현 기록을 먼저 노출하는 탐색 구조를 정리했습니다.',
    category: 'Portfolio',
    publishDate: '2026-03-08T09:00:00.000Z',
    readTime: 4,
    status: 'published',
    tags: ['Portfolio', 'Information Architecture'],
    image: '',
    likes: 7,
    views: 214,
    isFeatured: false,
    featuredOrder: 0,
  },
  {
    id: 107,
    title: '서비스 운영을 위한 통계 화면에서 중요한 것은 숫자보다 비교 기준',
    slug: 'analytics-screen-baselines',
    excerpt: '운영자 입장에서 바로 비교 가능한 기준선을 두는 방식에 대한 메모입니다.',
    category: 'Analytics',
    publishDate: '2026-03-05T09:00:00.000Z',
    readTime: 6,
    status: 'published',
    tags: ['Analytics', 'Admin', 'Dashboard'],
    image: '',
    likes: 6,
    views: 188,
    isFeatured: false,
    featuredOrder: 0,
  },
  {
    id: 108,
    title: '모바일 에디터에서 툴바를 그대로 줄이지 않고 재배치한 이유',
    slug: 'mobile-editor-toolbar',
    excerpt: '기능을 숨기는 대신 행동 맥락별로 표면을 나눈 방식입니다.',
    category: 'Editor',
    publishDate: '2026-03-03T09:00:00.000Z',
    readTime: 7,
    status: 'published',
    tags: ['Editor', 'Mobile', 'Tiptap'],
    image: '',
    likes: 8,
    views: 172,
    isFeatured: false,
    featuredOrder: 0,
  },
  {
    id: 109,
    title: '이력서 PDF 생성 품질을 화면과 맞추기 위해 점검한 항목',
    slug: 'resume-pdf-quality-checks',
    excerpt: '웹 화면과 PDF 레이아웃이 어긋나지 않게 점검한 기준을 정리했습니다.',
    category: 'PDF',
    publishDate: '2026-03-01T09:00:00.000Z',
    readTime: 5,
    status: 'published',
    tags: ['PDF', 'Resume', 'Frontend'],
    image: '',
    likes: 5,
    views: 149,
    isFeatured: false,
    featuredOrder: 0,
  },
  {
    id: 110,
    title: '운영 환경에서 JWT 비밀키를 교체할 때 겪는 복잡도 줄이기',
    slug: 'jwt-secret-rotation',
    excerpt: '세션 만료와 롤링 배포를 함께 고려한 토큰 교체 전략입니다.',
    category: 'Security',
    publishDate: '2026-02-26T09:00:00.000Z',
    readTime: 10,
    status: 'published',
    tags: ['JWT', 'Security', 'Operations'],
    image: '',
    likes: 12,
    views: 205,
    isFeatured: false,
    featuredOrder: 0,
  },
  {
    id: 111,
    title: '컨텐츠 워크플로우에서 아이디어 수집과 초안 생성을 분리한 이유',
    slug: 'idea-ingest-workflow',
    excerpt: 'AI 초안 흐름을 실제 작성 흐름과 섞지 않기 위해 나눈 경계를 설명합니다.',
    category: 'AI',
    publishDate: '2026-02-23T09:00:00.000Z',
    readTime: 8,
    status: 'published',
    tags: ['AI', 'Workflow', 'Content'],
    image: '',
    likes: 9,
    views: 191,
    isFeatured: false,
    featuredOrder: 0,
  },
  {
    id: 112,
    title: '모바일 사용성 점검을 코드 리뷰가 아니라 런타임 기준으로 해야 하는 이유',
    slug: 'mobile-runtime-audit',
    excerpt: 'viewport, safe-area, 클릭 밀도는 코드를 읽는 것만으로 충분하지 않았습니다.',
    category: 'Mobile',
    publishDate: '2026-02-20T09:00:00.000Z',
    readTime: 6,
    status: 'published',
    tags: ['Mobile', 'Audit', 'Playwright'],
    image: '',
    likes: 10,
    views: 223,
    isFeatured: false,
    featuredOrder: 0,
  },
];

const projects = [
  {
    id: 201,
    title: 'AI 글감 수집 파이프라인',
    slug: 'ai-idea-pipeline',
    description: 'ChatGPT 대화와 메모를 정리해 아이디어 후보로 전환하는 워크플로우입니다.',
    longDescription:
      '대화 원문을 그대로 저장하지 않고 후보 단위로 정리해 작성 효율을 높이는 내부 도구입니다.',
    category: '백오피스',
    status: 'completed',
    isFeatured: true,
    featuredOrder: 1,
    progress: 100,
    techStack: ['Node.js', 'NestJS', 'PostgreSQL', 'OpenAI'],
    features: ['세션 수집', '후보 정리', '초안 생성'],
    role: '기획, API 설계, 운영 흐름 정의',
    problem: '대화 로그에서 쓸만한 글감을 추출하는 데 시간이 오래 걸렸습니다.',
    approach: '대화 세션과 아이디어 후보를 분리해 운영 흐름을 단순화했습니다.',
    outcomes: '초안 작성 진입 시간이 줄고, 중복 아이디어 정리가 쉬워졌습니다.',
    impactMetrics: ['초안 진입 시간 60% 단축', '중복 정리 비용 감소'],
    resumeTitle: 'AI 아이디어 파이프라인',
    resumeSummary: '대화 로그를 글감 후보로 구조화하는 내부 도구',
    resumeHighlights: ['세션 분리', '초안 흐름 설계'],
    startDate: '2025-11-01',
    endDate: '2026-01-30',
    githubUrl: 'https://github.com/cycrypto/idea-pipeline',
    liveUrl: 'https://example.com/idea-pipeline',
    images: [],
    experienceId: 301,
    experience: {
      id: 301,
      type: 'career',
      title: '플랫폼 엔지니어',
      organization: '팀 블로그 플랫폼',
      startDate: '2025-08-01',
      endDate: '',
    },
    linkedPosts: [posts[10], posts[0]].map(toLinkedPost),
  },
  {
    id: 202,
    title: '포트폴리오 관리자 개편',
    slug: 'portfolio-admin-rework',
    description: '게시물, 프로젝트, 프로필을 운영 도구처럼 관리하도록 관리자 UX를 재구성했습니다.',
    longDescription:
      '목록 중심 관리 화면을 편집 흐름 중심으로 재배치하고 에디터와 이미지 업로드 UX를 정리했습니다.',
    category: '관리도구',
    status: 'completed',
    isFeatured: true,
    featuredOrder: 2,
    progress: 100,
    techStack: ['Next.js', 'TypeScript', 'Tiptap', 'shadcn/ui'],
    features: ['모바일 사이드바', 'Tiptap 편집기', '이미지 업로드'],
    role: '프론트엔드 설계와 구현',
    problem: '콘텐츠 관리 작업이 데스크톱 중심이라 이동 중 확인과 수정이 불편했습니다.',
    approach: '모바일 분기와 sheet 기반 탐색을 도입하고 폼 밀도를 조정했습니다.',
    outcomes: '관리 화면 접근성과 작성 속도가 개선됐습니다.',
    impactMetrics: ['모바일 접근성 개선', '편집 단계 수 감소'],
    resumeTitle: '관리자 UX 개편',
    resumeSummary: '콘텐츠 편집과 검수를 빠르게 만드는 관리자 화면 개편',
    resumeHighlights: ['모바일 사이드바', '폼 구조 재배치'],
    startDate: '2025-10-10',
    endDate: '2026-02-10',
    githubUrl: 'https://github.com/cycrypto/portfolio-blog',
    liveUrl: 'https://example.com/portfolio-admin',
    images: [],
    experienceId: 301,
    experience: {
      id: 301,
      type: 'career',
      title: '플랫폼 엔지니어',
      organization: '팀 블로그 플랫폼',
      startDate: '2025-08-01',
      endDate: '',
    },
    linkedPosts: [posts[1], posts[7]].map(toLinkedPost),
  },
  {
    id: 203,
    title: '기술 기록형 포트폴리오',
    slug: 'portfolio-blog-platform',
    description: '프로젝트 설명보다 구현 기록 탐색이 잘 되도록 만든 개인 포트폴리오 플랫폼입니다.',
    longDescription:
      '프로젝트, 글, 이력서를 한 흐름으로 엮어 채용형 포트폴리오가 아니라 탐색형 제품처럼 설계했습니다.',
    category: '포트폴리오',
    status: 'active',
    isFeatured: true,
    featuredOrder: 3,
    progress: 85,
    techStack: ['Next.js', 'NestJS', 'PostgreSQL', 'Docker'],
    features: ['프로젝트-글 연결', '이력서 PDF 생성', '댓글 관리'],
    role: '제품 설계, 풀스택 구현',
    problem: '프로젝트 설명만으로는 구현 역량이 잘 드러나지 않았습니다.',
    approach: '기술 글과 프로젝트를 연결하고 홈을 탐색 중심으로 설계했습니다.',
    outcomes: '기술 기록과 결과물을 함께 보여주는 구조가 정착되었습니다.',
    impactMetrics: ['탐색 경로 다변화', '프로젝트 체류 시간 증가'],
    resumeTitle: '탐색형 포트폴리오 플랫폼',
    resumeSummary: '프로젝트와 구현 기록을 함께 보여주는 개인 플랫폼',
    resumeHighlights: ['프로젝트-글 연결', '탐색형 IA'],
    startDate: '2025-07-01',
    endDate: '',
    githubUrl: 'https://github.com/cycrypto/portfolio-blog',
    liveUrl: 'https://example.com/portfolio-blog',
    images: [],
    experienceId: null,
    experience: null,
    linkedPosts: [posts[5], posts[3], posts[11]].map(toLinkedPost),
  },
  {
    id: 204,
    title: '운영 통계 대시보드',
    slug: 'ops-analytics-dashboard',
    description: '콘텐츠 운영 흐름의 병목을 빠르게 파악할 수 있는 통계 화면입니다.',
    longDescription:
      '조회수, 댓글, 문의 흐름을 한 화면에서 비교하고 관리자 액션으로 연결하도록 설계했습니다.',
    category: '분석',
    status: 'planned',
    isFeatured: false,
    featuredOrder: 0,
    progress: 40,
    techStack: ['Next.js', 'Recharts', 'NestJS'],
    features: ['행동 통계', '운영 지표 비교'],
    role: '요구사항 정리와 프로토타이핑',
    problem: '관리자가 현재 상태를 한 화면에서 파악하기 어려웠습니다.',
    approach: '운영 기준선을 두고 비교 가능한 구조로 설계했습니다.',
    outcomes: '우선순위가 높은 통계 요구를 정리했습니다.',
    impactMetrics: ['운영 병목 가시화'],
    resumeTitle: '운영 통계 대시보드',
    resumeSummary: '운영 흐름 병목을 빠르게 찾는 관리자 통계 화면',
    resumeHighlights: ['비교 기준선', '운영 액션 연결'],
    startDate: '2026-02-01',
    endDate: '',
    githubUrl: 'https://github.com/cycrypto/ops-dashboard',
    liveUrl: '',
    images: [],
    experienceId: 302,
    experience: {
      id: 302,
      type: 'team_project',
      title: '운영 도구 개선',
      organization: '사이드 프로젝트',
      startDate: '2026-01-01',
      endDate: '',
    },
    linkedPosts: [posts[6]].map(toLinkedPost),
  },
];

const experiences = [
  {
    id: 301,
    type: 'career',
    title: '플랫폼 엔지니어',
    organization: '팀 블로그 플랫폼',
    startDate: '2025-08-01',
    endDate: '',
    description:
      '콘텐츠 플랫폼의 백엔드, 관리자 도구, 운영 자동화를 함께 담당하며 기능 설계와 품질 기준을 정리했습니다.',
    resumeVisible: true,
    resumeOrder: 1,
    resumeHighlights: ['관리자 UX 재구성', 'AI 초안 파이프라인 설계'],
    linkedProjects: [projects[0], projects[1]].map(toLinkedProject),
  },
  {
    id: 302,
    type: 'team_project',
    title: '운영 도구 개선',
    organization: '사이드 프로젝트',
    startDate: '2026-01-01',
    endDate: '',
    description:
      '운영 통계, 문의 처리, 댓글 검수 흐름을 한 화면에서 다루는 관리 도구를 설계했습니다.',
    resumeVisible: true,
    resumeOrder: 2,
    resumeHighlights: ['운영 지표 정의', '모바일 검수 흐름 설계'],
    linkedProjects: [projects[3]].map(toLinkedProject),
  },
  {
    id: 303,
    type: 'career',
    title: '백엔드 개발자',
    organization: '커머스 플랫폼',
    startDate: '2023-01-01',
    endDate: '2025-07-31',
    description:
      '주문, 인증, 캐시, 장애 대응을 다루며 서비스 경계와 운영 자동화를 설계했습니다.',
    resumeVisible: true,
    resumeOrder: 3,
    resumeHighlights: ['캐시 무효화 전략', 'JWT 운영 개선'],
    linkedProjects: [],
  },
  {
    id: 304,
    type: 'club',
    title: '기술 글쓰기 스터디',
    organization: '개발자 커뮤니티',
    startDate: '2024-06-01',
    endDate: '2025-03-01',
    description:
      '기술 기록을 결과물 중심이 아니라 문제 해결 흐름 중심으로 정리하는 훈련을 했습니다.',
    resumeVisible: true,
    resumeOrder: 4,
    resumeHighlights: ['기술 글 구조화', '동료 피드백 루프'],
    linkedProjects: [],
  },
];

function toLinkedPost(post) {
  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    category: post.category,
    publishDate: post.publishDate,
    readTime: post.readTime,
    status: post.status,
    tags: post.tags,
  };
}

function toLinkedProject(project) {
  return {
    id: project.id,
    title: project.title,
    slug: project.slug,
    category: project.category,
    status: project.status,
    startDate: project.startDate,
    endDate: project.endDate,
  };
}

function ok(data) {
  return {
    success: true,
    timestamp: new Date().toISOString(),
    data,
  };
}

function json(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Cache-Control': 'no-store',
  });
  res.end(JSON.stringify(payload));
}

function notFound(res, message) {
  json(res, 404, {
    success: false,
    timestamp: new Date().toISOString(),
    message,
  });
}

function getTopTags(limit) {
  const counts = new Map();

  for (const post of posts) {
    for (const tag of post.tags || []) {
      counts.set(tag, (counts.get(tag) || 0) + 1);
    }
  }

  return [...counts.entries()]
    .map(([name, usageCount], index) => ({
      id: index + 1,
      name,
      usageCount,
    }))
    .sort((left, right) => right.usageCount - left.usageCount || left.name.localeCompare(right.name))
    .slice(0, limit);
}

function filterPosts(searchParams) {
  const keyword = (searchParams.get('keyword') || '').trim().toLowerCase();
  const tag = (searchParams.get('tag') || searchParams.get('tags') || '').trim().toLowerCase();
  const page = Math.max(1, Number.parseInt(searchParams.get('page') || '1', 10) || 1);
  const pageSize = Math.max(1, Number.parseInt(searchParams.get('pageSize') || '10', 10) || 10);

  const filtered = posts.filter((post) => {
    const matchesKeyword =
      !keyword ||
      [post.title, post.excerpt, post.category, ...(post.tags || [])]
        .join(' ')
        .toLowerCase()
        .includes(keyword);

    const matchesTag =
      !tag || (post.tags || []).some((entry) => entry.toLowerCase() === tag);

    return matchesKeyword && matchesTag && post.status === 'published';
  });

  const sorted = [...filtered].sort(
    (left, right) => new Date(right.publishDate).getTime() - new Date(left.publishDate).getTime(),
  );

  const startIndex = (page - 1) * pageSize;

  return {
    data: sorted.slice(startIndex, startIndex + pageSize),
    totalCount: sorted.length,
  };
}

function findProject(identifier) {
  return projects.find(
    (project) => String(project.id) === identifier || project.slug === identifier,
  );
}

function findPost(identifier) {
  return posts.find((post) => String(post.id) === identifier || post.slug === identifier);
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url || '/', `http://${HOST}:${PORT}`);

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Cache-Control': 'no-store',
    });
    res.end();
    return;
  }

  if (req.method !== 'GET') {
    notFound(res, 'Mock server only supports GET for this audit.');
    return;
  }

  if (url.pathname === '/') {
    json(res, 200, ok({ message: 'mobile mock api ready' }));
    return;
  }

  if (url.pathname === '/profile') {
    json(res, 200, ok(profile));
    return;
  }

  if (url.pathname === '/projects') {
    json(res, 200, ok(projects));
    return;
  }

  if (url.pathname.startsWith('/projects/')) {
    const project = findProject(url.pathname.split('/').pop() || '');
    if (!project) {
      notFound(res, 'Project not found');
      return;
    }
    json(res, 200, ok(project));
    return;
  }

  if (url.pathname === '/experiences') {
    json(res, 200, ok(experiences));
    return;
  }

  if (url.pathname === '/posts') {
    json(res, 200, ok(filterPosts(url.searchParams)));
    return;
  }

  if (url.pathname.startsWith('/posts/')) {
    const post = findPost(url.pathname.split('/').pop() || '');
    if (!post) {
      notFound(res, 'Post not found');
      return;
    }
    json(res, 200, ok(post));
    return;
  }

  if (url.pathname === '/tags/top') {
    const limit = Math.max(1, Number.parseInt(url.searchParams.get('limit') || '5', 10) || 5);
    json(res, 200, ok(getTopTags(limit)));
    return;
  }

  notFound(res, `No mock handler for ${url.pathname}`);
});

server.listen(PORT, HOST, () => {
  console.log(`Mock API server listening on http://${HOST}:${PORT}`);
});

function shutdown() {
  server.close(() => {
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
