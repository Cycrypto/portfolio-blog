import { z } from "zod";
const appErrorMarker = Symbol.for("portfolio-blog/app-error");
export class AppError extends Error {
  readonly [appErrorMarker] = true;
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
export function isAppError(error: unknown): error is AppError {
  return error instanceof Error && (error as AppError)[appErrorMarker] === true;
}
const slug = z
  .string()
  .trim()
  .min(1, "URL 슬러그를 입력해 주세요.")
  .max(100)
  .regex(
    /^[a-z0-9가-힣]+(?:-[a-z0-9가-힣]+)*$/,
    "슬러그는 영문 소문자, 한글, 숫자와 하이픈을 사용할 수 있습니다.",
  );
const imageUrl = z
  .string()
  .max(2000)
  .refine(
    (value) =>
      !value ||
      /^\/api\/media\/[a-zA-Z0-9-]+$/.test(value) ||
      /^https?:\/\//.test(value),
    "올바른 이미지 주소를 입력해 주세요.",
  );
export const postSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "제목을 입력해 주세요.")
      .max(160, "제목은 160자까지 입력할 수 있습니다."),
    slug,
    excerpt: z.string().max(160, "요약은 160자까지 입력할 수 있습니다."),
    bodyMarkdown: z.string().max(1_000_000, "본문이 너무 깁니다."),
    coverUrl: imageUrl,
    coverAlt: z.string().max(300),
    tags: z
      .array(z.string().trim().min(1).max(32))
      .max(12)
      .transform((tags) => [...new Set(tags)]),
    status: z.enum(["draft", "published"]),
    visibility: z.enum(["public", "private"]),
    seriesId: z.string().max(64).nullable(),
    revision: z.number().int().positive().optional(),
  })
  .superRefine((post, ctx) => {
    if (post.status === "published" && !post.bodyMarkdown.trim())
      ctx.addIssue({
        code: "custom",
        path: ["bodyMarkdown"],
        message: "발행하려면 본문을 작성해 주세요.",
      });
    if (post.coverUrl && !post.coverAlt.trim())
      ctx.addIssue({
        code: "custom",
        path: ["coverAlt"],
        message: "대표 이미지의 대체 텍스트를 입력해 주세요.",
      });
  });
export const seriesSchema = z.object({
  name: z.string().trim().min(1, "시리즈 이름을 입력해 주세요.").max(100),
  slug,
  description: z.string().max(300),
  revision: z.number().int().positive().optional(),
  postIds: z.array(z.string().max(64)).max(1000).optional(),
});
export const introSchema = z.object({
  eyebrow: z
    .string()
    .trim()
    .max(60, "상단 라벨은 60자까지 입력할 수 있습니다."),
  name: z
    .string()
    .trim()
    .min(1, "이름을 입력해 주세요.")
    .max(40, "이름은 40자까지 입력할 수 있습니다."),
  headline: z
    .string()
    .trim()
    .min(1, "헤드라인을 입력해 주세요.")
    .max(160, "헤드라인은 160자까지 입력할 수 있습니다.")
    .transform((value) => value.replace(/\r\n?/g, "\n")),
  description: z
    .string()
    .trim()
    .max(400, "소개는 400자까지 입력할 수 있습니다."),
});
export function parseInput<T>(schema: z.ZodType<T>, input: unknown): T {
  const parsed = schema.safeParse(input);
  if (!parsed.success) throw new AppError(parsed.error.issues[0].message);
  return parsed.data;
}
