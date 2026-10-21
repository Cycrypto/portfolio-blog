// Test-only Ghost boundary. No application code imports this file.
import { jwtVerify } from "jose";

export const ghostTestKey = `${"a".repeat(24)}:${"b".repeat(64)}`;
export const fixtureId = (number) => number.toString(16).padStart(24, "0");
export function ghostFixture() {
  const tags = [
    {
      id: fixtureId(1),
      name: "홈서버 구축",
      slug: "series-home-server",
      visibility: "public",
      description: "서버를 차근차근 만들어 봅니다.",
    },
    {
      id: fixtureId(2),
      name: "개발 기록",
      slug: "series-dev",
      visibility: "public",
      description: "",
    },
    {
      id: fixtureId(3),
      name: "인프라",
      slug: "infra",
      visibility: "public",
      description: "",
    },
  ];
  const timestamp = "2026-10-20T00:00:00.000Z";
  const posts = [
    {
      id: fixtureId(101),
      title: "서버 준비",
      status: "published",
      published_at: "2026-10-01T00:00:00.000Z",
      tags: [tags[2], tags[0], tags[1]],
    },
    {
      id: fixtureId(102),
      title: "Docker 설치",
      status: "published",
      published_at: "2026-10-02T00:00:00.000Z",
      tags: [tags[2], tags[0]],
    },
    {
      id: fixtureId(103),
      title: "서비스 배포",
      status: "published",
      published_at: "2026-10-03T00:00:00.000Z",
      tags: [tags[2]],
    },
    {
      id: fixtureId(104),
      title: "백업 설정",
      status: "draft",
      published_at: null,
      tags: [tags[2]],
    },
    {
      id: fixtureId(105),
      title: "모니터링",
      status: "scheduled",
      published_at: "2026-11-01T00:00:00.000Z",
      tags: [tags[2]],
    },
  ].map((post) => ({ ...post, updated_at: timestamp }));
  return structuredClone({ tags, posts, counter: 1000 });
}

export async function ghostResponse(state, input, init) {
  const url = new URL(String(input));
  const token = new Headers(init.headers)
    .get("authorization")
    ?.replace(/^Ghost /, "");
  try {
    await jwtVerify(token || "", Buffer.from("b".repeat(64), "hex"), {
      audience: "/admin/",
      algorithms: ["HS256"],
    });
  } catch {
    return Response.json({}, { status: 401 });
  }
  const method = init.method || "GET";
  const [, resource, id] =
    /^\/ghost\/api\/admin\/(posts|tags)\/(?:([a-f\d]{24})\/)?$/.exec(
      url.pathname,
    ) || [];
  if (!resource) return Response.json({}, { status: 404 });
  if (method === "GET") {
    if (resource === "posts" && url.searchParams.get("include") !== "tags")
      throw new Error("Post tags must be requested");
    const entries = state[resource].filter(
      (entry) => resource !== "tags" || entry.visibility === "public",
    );
    const page = Number(url.searchParams.get("page") || 1),
      limit = Number(url.searchParams.get("limit") || 100);
    return Response.json({
      [resource]: entries.slice((page - 1) * limit, page * limit),
      meta: {
        pagination: { next: entries.length > page * limit ? page + 1 : null },
      },
    });
  }
  const data = JSON.parse(init.body)[resource][0];
  const stamp = () =>
    new Date(
      Date.parse("2026-10-20T00:00:00Z") + ++state.counter,
    ).toISOString();
  const tagFor = (tag) => {
    let existing = state.tags.find((entry) =>
      tag.id ? entry.id === tag.id : entry.name === tag.name,
    );
    if (!existing) {
      existing = {
        id: fixtureId(++state.counter),
        name: tag.name,
        slug: tag.name.replace(/^#/, "hash-"),
        description: "",
        visibility: tag.name.startsWith("#") ? "internal" : "public",
      };
      state.tags.push(existing);
    }
    return structuredClone(existing);
  };
  if (method === "POST" && resource === "tags") {
    const tag = {
      ...data,
      id: fixtureId(++state.counter),
      updated_at: stamp(),
    };
    state.tags.push(tag);
    return Response.json({ tags: [tag] }, { status: 201 });
  }
  const entry = state[resource].find((entry) => entry.id === id);
  if (!entry) return Response.json({}, { status: 404 });
  if (resource === "posts") {
    if (data.updated_at !== entry.updated_at)
      return Response.json({}, { status: 409 });
    if (Object.keys(data).some((key) => !["tags", "updated_at"].includes(key)))
      throw new Error("Series saves must only update tags");
    entry.tags = data.tags.map(tagFor);
    entry.updated_at = stamp();
  } else {
    Object.assign(entry, data, { updated_at: stamp() });
    state.posts.forEach((post) => {
      post.tags = post.tags.map((tag) =>
        tag.id === entry.id ? structuredClone(entry) : tag,
      );
    });
  }
  return Response.json({ [resource]: [entry] });
}
