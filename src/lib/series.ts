import { createHash, randomUUID } from "node:crypto";
import { z } from "zod";
import { seriesOrder } from "../../ghost/theme/assets/js/series-order.js";
import { GhostAdmin, type GhostPost, type GhostTag } from "./ghost-admin";
import { AppError, parseInput } from "./validation";
import {
  byPublication,
  type BlogSeries,
  type SeriesPost,
  type SeriesWorkspace,
} from "./series-types";

const details = {
  name: z.string().trim().min(1, "시리즈 이름을 입력해 주세요.").max(150),
  description: z.string().trim().max(500),
};
const createSchema = z.object(details);
const updateSchema = z.object({
  ...details,
  id: z.string().regex(/^[a-f\d]{24}$/i),
  revision: z.string().regex(/^[a-f\d]{64}$/),
  order: z.enum(["publication", "manual"]),
  postIds: z
    .array(z.string().regex(/^[a-f\d]{24}$/i))
    .max(5000)
    .refine((ids) => new Set(ids).size === ids.length, "글이 중복됐습니다."),
});
const asPost = (post: GhostPost): SeriesPost => ({
  id: post.id,
  title: post.title,
  status: post.status,
  publishedAt: post.published_at,
});
const scopePrefix = (id: string) => `#series-order-${id}-`;
const orderValue = (post: GhostPost, id: string) =>
  seriesOrder(post.tags.map((tag) => tag.name).join(" "), id);
const isSeries = (tag: GhostTag) =>
  tag.visibility === "public" && tag.slug.startsWith("series-");

async function snapshot(admin: GhostAdmin) {
  const [tags, posts] = await Promise.all([
    admin.browse<GhostTag>("tags", { filter: "visibility:public" }),
    admin.browse<GhostPost>("posts", {
      include: "tags",
      filter: "status:[draft,published,scheduled]",
      fields: "id,title,status,published_at,updated_at",
    }),
  ]);
  const seriesTags = tags
    .filter(isSeries)
    .sort((a, b) => a.id.localeCompare(b.id));
  posts.sort((a, b) => a.id.localeCompare(b.id));
  const revision = createHash("sha256")
    .update(JSON.stringify({ tags: seriesTags, posts }))
    .digest("hex");
  return { tags: seriesTags, posts, revision };
}

function workspace(
  admin: GhostAdmin,
  state: Awaited<ReturnType<typeof snapshot>>,
): SeriesWorkspace {
  const series: BlogSeries[] = state.tags.map((tag) => {
    const members = state.posts.filter((post) =>
      post.tags.some((t) => t.id === tag.id),
    );
    const manual = members.some((post) =>
      Number.isFinite(orderValue(post, tag.id)),
    );
    members.sort((a, b) => {
      const first = orderValue(a, tag.id),
        second = orderValue(b, tag.id);
      return (
        (manual && first !== second ? first - second : 0) ||
        byPublication(asPost(a), asPost(b))
      );
    });
    return {
      id: tag.id,
      name: tag.name,
      description: tag.description || "",
      url: `${admin.blogUrl}/tag/${encodeURIComponent(tag.slug)}/`,
      order: manual ? "manual" : "publication",
      postIds: members.map((post) => post.id),
    };
  });
  series.sort((a, b) => a.name.localeCompare(b.name, "ko"));
  return {
    revision: state.revision,
    blogUrl: admin.blogUrl,
    series,
    posts: state.posts.map(asPost).sort(byPublication),
  };
}

export async function getSeriesWorkspace(admin = new GhostAdmin()) {
  return workspace(admin, await snapshot(admin));
}

export async function createSeries(input: unknown, admin = new GhostAdmin()) {
  const data = parseInput(createSchema, input);
  const result = await admin.request<GhostTag>("tags/", "POST", {
    tags: [{ ...data, slug: `series-${randomUUID()}`, visibility: "public" }],
  });
  return {
    ...(await getSeriesWorkspace(admin)),
    selectedId: result.tags?.[0]?.id,
  };
}

export async function saveSeries(input: unknown, admin = new GhostAdmin()) {
  const data = parseInput(updateSchema, input);
  const current = await snapshot(admin);
  if (current.revision !== data.revision)
    throw new AppError(
      "블로그 내용이 변경됐습니다. 새로 불러온 뒤 다시 저장해 주세요.",
      409,
    );
  const series = current.tags.find((tag) => tag.id === data.id);
  if (!series) throw new AppError("시리즈를 찾을 수 없습니다.", 404);
  const available = new Set(current.posts.map((post) => post.id));
  if (data.postIds.some((id) => !available.has(id)))
    throw new AppError(
      "추가할 글을 찾을 수 없습니다. 새로 불러와 주세요.",
      409,
    );
  const positions = new Map(data.postIds.map((id, index) => [id, index + 1]));
  const prefix = scopePrefix(series.id);
  let changed = false;
  try {
    for (const post of current.posts) {
      const member = post.tags.some((tag) => tag.id === series.id);
      const position = positions.get(post.id);
      if (!member && position === undefined) continue;
      // Replace only this series' relations. Keep topics, primary tag order,
      // other series, and their independent ordering intact.
      const tags: { id?: string; name: string }[] = post.tags
        .filter(
          (tag) =>
            !tag.name.startsWith(prefix) &&
            (position !== undefined || tag.id !== series.id),
        )
        .map((tag) => ({ id: tag.id, name: tag.name }));
      if (position !== undefined) {
        if (!member) tags.push({ id: series.id, name: series.name });
        const name = `${prefix}${data.order === "manual" ? position : "auto"}`;
        const existing = post.tags.find((tag) => tag.name === name);
        tags.push(existing ? { id: existing.id, name } : { name });
      }
      if (
        JSON.stringify(tags.map((tag) => tag.name)) ===
        JSON.stringify(post.tags.map((tag) => tag.name))
      )
        continue;
      await admin.request(`posts/${post.id}/`, "PUT", {
        posts: [{ updated_at: post.updated_at, tags }],
      });
      changed = true;
    }
    if (
      series.name !== data.name ||
      (series.description || "") !== data.description
    ) {
      await admin.request(`tags/${series.id}/`, "PUT", {
        tags: [
          {
            name: data.name,
            description: data.description,
            updated_at: series.updated_at,
          },
        ],
      });
      changed = true;
    }
    return await getSeriesWorkspace(admin);
  } catch (error) {
    // Ghost offers per-post collision detection, but no multi-post transaction.
    // Surface partial saves rather than claiming a rollback or a full success.
    if (changed)
      throw new AppError(
        "저장 도중 멈췄습니다. 일부 변경이 반영됐을 수 있으니 새로 불러와 확인해 주세요.",
        409,
      );
    throw error;
  }
}
