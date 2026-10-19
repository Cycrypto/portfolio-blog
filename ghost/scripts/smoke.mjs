#!/usr/bin/env node
// Local and CI check for a fresh docker-compose.blog.yml stack.
// It creates the owner account, activates the junha theme, seeds sample posts,
// and verifies the screens from the approved design. Do not run it against production.
import { randomBytes } from 'node:crypto';

const site = (process.env.BLOG_URL || 'http://127.0.0.1:13001').replace(/\/$/, '');
const email = process.env.SMOKE_EMAIL || 'owner@example.com';
const password = process.env.SMOKE_PASSWORD || `Smoke-${randomBytes(12).toString('base64url')}`;
const adminApi = `${site}/ghost/api/admin`;
let cookie = '';

const serverImage =
  'https://images.unsplash.com/photo-1594915440248-1e419eba6611?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1600';
const laptopImage =
  'https://images.unsplash.com/photo-1662116137257-6e5793c365ec?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1600';

const posts = [
  {
    title: '하나의 서버에 CV와 블로그 운영하기',
    slug: 'cv-and-blog-on-one-server',
    custom_excerpt: 'Docker Compose로 서비스를 분리하고, 서브도메인을 연결한 과정.',
    feature_image: serverImage,
    published_at: '2026-10-19T01:00:00.000Z',
    tags: [{ name: '인프라', slug: 'infra' }, { name: 'Docker', slug: 'docker' }],
    html: [
      '<p>CV와 블로그는 같은 서버에서 운영하지만, 업데이트와 데이터는 독립적으로 관리하고 싶었습니다. Docker Compose 프로젝트를 나누고, 각 서비스에 서브도메인을 연결했습니다.</p>',
      '<h2>공간을 나누는 이유</h2>',
      '<p>CV는 나를 소개하는 공간이고, 블로그는 생각을 쌓아 가는 공간입니다. 같은 기반 위에 있지만 바뀌는 주기도, 필요한 데이터도 다릅니다.</p>',
      '<h2>독립적으로 배포하기</h2>',
      '<p>Compose 프로젝트를 나누면 블로그를 업데이트할 때 CV를 함께 재시작할 필요가 없습니다.</p>',
      '<figure class="kg-card kg-code-card"><pre><code class="language-yaml">name: junha-blog\n\nservices:\n  ghost:\n    ports:\n      - "127.0.0.1:13001:2368"\n    environment:\n      url: https://blog.junha.space</code></pre><figcaption>docker-compose.blog.yml</figcaption></figure>',
      '<h2>주소도 각자의 이름으로</h2>',
      '<p>junha.space는 CV로, blog.junha.space는 블로그로 연결합니다. 실제 서비스 연결은 Tunnel에서 나눕니다.</p>',
      '<h2>오래 운영하기 위한 선택</h2>',
      '<p>테마는 Git에, 콘텐츠는 영구 볼륨에 보관하고 백업을 함께 준비합니다. <code>docker compose</code> 명령 하나로 다시 띄울 수 있게 했습니다.</p>',
    ].join(''),
  },
  {
    title: '배포 이후를 위한 헬스체크와 롤백',
    slug: 'health-checks-and-rollback',
    custom_excerpt: '문제가 생겼을 때 빠르게 알아채고, 이전 상태로 돌아가기 위한 준비.',
    published_at: '2026-10-15T01:00:00.000Z',
    tags: [{ name: '인프라', slug: 'infra' }],
    html: '<p>배포는 끝이 아니라 운영의 시작입니다.</p><h2>헬스체크</h2><p>컨테이너가 준비되었는지 확인합니다.</p>',
  },
  {
    title: '타입이 알려주지 않는 것들',
    slug: 'what-types-do-not-tell',
    custom_excerpt: 'TypeScript를 사용하면서도 런타임 검증이 필요한 이유.',
    feature_image: laptopImage,
    published_at: '2026-10-10T01:00:00.000Z',
    tags: [{ name: '개발', slug: 'dev' }],
    html: '<p>타입은 컴파일 시점의 약속입니다. 외부에서 들어오는 값은 런타임에 다시 확인해야 합니다.</p>',
  },
  {
    title: '오래 읽히는 화면을 만들고 싶어서',
    slug: 'screens-that-read-well',
    custom_excerpt: '작은 개인 사이트에서 시작한 글꼴과 읽기 경험에 대한 고민.',
    published_at: '2026-10-04T01:00:00.000Z',
    tags: [{ name: '회고', slug: 'retrospective' }],
    html: '<p>글꼴과 행간, 줄 길이를 하나씩 다시 정했습니다.</p>',
  },
];

async function admin(path, { method = 'GET', body, expect = [200] } = {}) {
  const response = await fetch(`${adminApi}${path}`, {
    method,
    redirect: 'manual',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Origin: site,
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const setCookies = response.headers.getSetCookie();
  if (setCookies.length) cookie = setCookies.map((value) => value.split(';')[0]).join('; ');
  const text = await response.text();
  if (!expect.includes(response.status)) {
    throw new Error(`${method} ${path} returned ${response.status}: ${text.slice(0, 400)}`);
  }
  return text ? JSON.parse(text) : {};
}

async function page(path, expectedStatus = 200) {
  const response = await fetch(`${site}${path}`, { redirect: 'manual' });
  const html = await response.text();
  if (response.status !== expectedStatus) throw new Error(`GET ${path} returned ${response.status}`);
  return html;
}

function expectIn(html, pattern, label) {
  const ok = typeof pattern === 'string' ? html.includes(pattern) : pattern.test(html);
  if (!ok) throw new Error(`Missing ${label}`);
}

async function waitForGhost() {
  const deadline = Date.now() + 240_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${adminApi}/site/`);
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  throw new Error(`Ghost did not become ready at ${site}`);
}

await waitForGhost();
const setup = await admin('/authentication/setup/');
const freshSite = !setup.setup[0].status;
if (freshSite) {
  await admin('/authentication/setup/', {
    method: 'POST',
    expect: [200, 201],
    body: { setup: [{ name: 'Junha', email, password, blogTitle: 'Junha' }] },
  });
} else if (!process.env.SMOKE_PASSWORD) {
  throw new Error('This Ghost site is already set up; pass SMOKE_EMAIL and SMOKE_PASSWORD');
}
await admin('/session/', { method: 'POST', expect: [200, 201], body: { username: email, password } });

const activated = await admin('/themes/junha/activate/', { method: 'PUT' });
if (!activated.themes?.[0]?.active) throw new Error('The junha theme was not activated');
const themeErrors = activated.themes[0].errors || [];
if (themeErrors.length) throw new Error(`Theme errors: ${JSON.stringify(themeErrors)}`);

await admin('/settings/', {
  method: 'PUT',
  body: {
    settings: [
      { key: 'title', value: 'Junha' },
      { key: 'description', value: '개발과 운영에 대한 기록' },
      { key: 'locale', value: 'ko' },
      { key: 'timezone', value: 'Asia/Seoul' },
      { key: 'accent_color', value: '#AD3B25' },
      {
        key: 'secondary_navigation',
        value: JSON.stringify([
          { label: '개발', url: '/tag/dev/' },
          { label: '인프라', url: '/tag/infra/' },
          { label: '회고', url: '/tag/retrospective/' },
        ]),
      },
    ],
  },
});

const existing = await admin('/posts/?limit=all&fields=id,slug');
const existingSlugs = new Set(existing.posts.map((post) => post.slug));
for (const post of freshSite ? existing.posts : []) {
  if (!posts.some((sample) => sample.slug === post.slug)) {
    await admin(`/posts/${post.id}/`, { method: 'DELETE', expect: [204] });
  }
}
for (const post of posts) {
  if (existingSlugs.has(post.slug)) continue;
  await admin('/posts/?source=html', {
    method: 'POST',
    expect: [200, 201],
    body: { posts: [{ ...post, status: 'published' }] },
  });
}

const home = await page('/');
expectIn(home, 'class="post-card has-image"', 'a list item with a thumbnail');
expectIn(home, /class="post-card"\s*>/, 'a list item without a thumbnail');
expectIn(home, /aria-current="page">전체</, 'the active "all" filter');
expectIn(home, 'data-search-dialog', 'the search dialog');
if (/sodo-search|portal\.min\.js/.test(home)) throw new Error('Ghost default search or Portal is still injected');

const tag = await page('/tag/infra/');
expectIn(tag, '2개의 글', 'the tag post count');
expectIn(tag, /aria-current="page">인프라</, 'the active tag filter');

const post = await page('/cv-and-blog-on-one-server/');
expectIn(post, 'class="article-title"', 'the article title');
expectIn(post, 'language-yaml', 'the code card');
expectIn(post, 'data-toc-desktop', 'the table of contents container');
expectIn(post, 'health-checks-and-rollback', 'the next post link');

const missing = await page('/no-such-page/', 404);
expectIn(missing, '페이지를', 'the 404 message');

const apiUrl = home.match(/data-api-url="([^"]+)"/)?.[1];
const apiKey = home.match(/data-api-key="([^"]+)"/)?.[1];
if (!apiUrl || !apiKey) throw new Error('Search is missing the Content API URL or key');
const search = await fetch(`${apiUrl}posts/?key=${apiKey}&limit=100&include=tags&fields=title,url`);
if (!search.ok) throw new Error(`Content API search returned ${search.status}`);
const searchPosts = (await search.json()).posts;
if (searchPosts.length !== posts.length) throw new Error(`Search index has ${searchPosts.length} posts`);

console.log(`Ghost theme smoke check passed at ${site}`);
