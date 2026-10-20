// Used only by the local/CI smoke stack, never by the published theme.
export const seriesSlug = "series-home-server";
export const seriesName = "홈서버 구축";
const tag = { name: seriesName, slug: seriesSlug };
const titles = [
  "백업과 복원 준비하기",
  "서버와 운영체제 준비하기",
  "블로그 도메인 연결하기",
  "Docker Compose로 서비스 나누기",
  "관리자 접근 보호하기",
  "이미지와 데이터 보관하기",
  "배포 과정 자동화하기",
  "로그를 읽기 쉽게 남기기",
  "컨테이너 상태 확인하기",
  "문제 있는 배포 되돌리기",
  "서비스 업데이트하기",
  "운영하면서 배운 것들",
];
// Intentionally differs from publication order, with a tie and a missing order.
const orders = [20, 1, 10, 2, 10, 40, 50, 60, 70, 80, 90, null];
export const seriesPosts = titles.map((title, index) => ({
  title,
  slug: `series-smoke-${index + 1}`,
  custom_excerpt: "하나의 서버에서 서비스를 운영하며 정리한 과정.",
  published_at: `2026-09-${String(index + 1).padStart(2, "0")}T01:00:00.000Z`,
  tags: [
    { name: "홈서버", slug: "home-server" },
    tag,
    ...(orders[index] ? [{ name: `#series-order-${orders[index]}` }] : []),
  ],
  html: "<p>서비스를 직접 운영하면서 확인한 내용을 기록합니다.</p><h2>설정하기</h2><p>필요한 설정부터 하나씩 적용합니다.</p><h2>확인하기</h2><p>설정한 내용이 실제 환경에서도 동작하는지 확인합니다.</p>",
}));
export const expectedSeriesSlugs = [2, 4, 3, 5, 1, 6, 7, 8, 9, 10, 11, 12].map(
  (number) => `series-smoke-${number}`,
);
export const extraSeriesPosts = [
  {
    title: "시리즈에 노출되면 안 되는 초안",
    slug: "series-smoke-draft",
    status: "draft",
    tags: [tag, { name: "#series-order-3" }],
    html: "<p>아직 공개하지 않은 글입니다.</p>",
  },
  {
    title: "한 편으로 끝내는 설정",
    slug: "series-smoke-single",
    published_at: "2026-08-01T01:00:00.000Z",
    tags: [
      { name: "한 편으로 끝내는 설정", slug: "series-single" },
      { name: "#series-order-1" },
    ],
    html: "<p>이 시리즈에는 한 편만 있습니다.</p>",
  },
];

// Cross Ghost 6's 100-post query cap, including a current post in the second batch.
export const longSeriesPosts = Array.from({ length: 101 }, (_, index) => ({
  title: `긴 시리즈 ${index + 1}편`,
  slug: `series-long-${index + 1}`,
  published_at: new Date(Date.UTC(2026, 6, 1, index)).toISOString(),
  tags: [
    { name: "긴 시리즈", slug: "series-long" },
    { name: `#series-order-${101 - index}` },
  ],
  html: "<p>100편을 넘는 시리즈의 목록과 이동을 확인하는 테스트 글입니다.</p>",
}));
