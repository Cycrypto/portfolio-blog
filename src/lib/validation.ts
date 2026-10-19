import { z } from "zod";
import { portfolioAssets } from "@/data/portfolio-assets";
const appErrorMarker = Symbol.for("portfolio/app-error");
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
const text = (max = 300) => z.string().trim().max(max);
const required = (max = 100) => text(max).min(1, "필수 항목을 입력해 주세요.");
export const safeHref = (value: string) => {
  if (!value) return true;
  if (/^\/[a-zA-Z0-9/_#.?%=&-]*$/.test(value) && !value.startsWith("//"))
    return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password;
  } catch {
    return false;
  }
};
const href = text(2000).refine(
  safeHref,
  "링크는 사이트 내부 경로 또는 https:// 주소여야 합니다.",
);
const asset = text(2000).refine(
  (v) => !v || Object.hasOwn(portfolioAssets, v) || safeHref(v),
  "이미지는 기존 에셋 이름, 내부 경로 또는 https:// 주소여야 합니다.",
);
const image = { icon: asset };
const label = { label: required() };
const list = (max = 20) => z.array(required(300)).max(max);
export const sectionIds = [
  "about",
  "experience",
  "activities",
  "certifications",
  "skills",
  "languages",
  "contact",
] as const;
export type SectionId = (typeof sectionIds)[number];
const section = z.enum(sectionIds);
// Organisations with one or more roles each, shown as a logo-led timeline.
const timeline = z.object({
  ...label,
  companies: z
    .array(
      z.object({
        name: required(),
        logo: asset,
        roles: z
          .array(
            z.object({
              title: required(160),
              employmentType: text(100),
              period: text(100),
              description: text(2000),
              highlights: list(12),
            }),
          )
          .min(1, "직무를 하나 이상 추가해 주세요.")
          .max(8),
      }),
    )
    .max(12),
});
export type Timeline = z.infer<typeof timeline>;
export const homeSchema = z.object({
  navigation: z.object({
    logo: asset,
    items: z.array(z.object({ ...label, section })).max(8),
    contact: z.object({ ...label, ...image }),
  }),
  intro: z.object({
    title: required(160),
    description: text(600),
    illustration: asset,
    cta: z.object({
      ...label,
      section,
      imageKeys: z.array(asset).max(4),
      arrow: asset,
    }),
    profile: z.object({
      name: required(80),
      role: text(160),
      description: text(600),
      avatar: asset,
      signature: asset,
      facts: z.array(z.object({ text: required(120), ...image })).max(6),
      downloadCv: z.object({ ...label, href }),
    }),
  }),
  about: z.object({
    ...label,
    description: text(2000),
    keySkillsLabel: text(100),
    keySkills: list(),
  }),
  experience: timeline,
  activities: timeline,
  certifications: z.object({
    ...label,
    items: z
      .array(
        z.object({
          title: required(160),
          issuer: text(160),
          issued: text(100),
          logo: asset,
        }),
      )
      .max(16),
  }),
  skills: z.object({
    ...label,
    items: z
      .array(
        z.object({
          name: required(300),
          level: z.enum(["", "advanced", "intermediate", "beginner"]),
        }),
      )
      .max(30),
    technologiesLabel: text(100),
    technologies: z.array(z.object({ name: required(), ...image })).max(24),
  }),
  languages: z.object({
    ...label,
    items: z
      .array(
        z.object({ name: required(), proficiency: text(200), flag: asset }),
      )
      .max(12),
  }),
  contact: z.object({
    ...label,
    description: text(600),
    illustration: asset,
    networkLabel: text(100),
    channels: z
      .array(
        z
          .object({
            kind: z.enum(["email", "phone"]),
            ...label,
            value: required(160),
            ...image,
          })
          .superRefine((c, ctx) => {
            if (c.kind === "email" && !z.email().safeParse(c.value).success)
              ctx.addIssue({
                code: "custom",
                path: ["value"],
                message: "올바른 이메일 주소를 입력해 주세요.",
              });
            if (c.kind === "phone" && !/^\+?[0-9() .-]{3,40}$/.test(c.value))
              ctx.addIssue({
                code: "custom",
                path: ["value"],
                message: "전화번호 형식을 확인해 주세요.",
              });
          }),
      )
      .max(4),
    networks: z.array(z.object({ name: required(), ...image, href })).max(8),
  }),
  footer: z.object({ copyright: text(160), backToTop: z.object(label) }),
});
export const homeUpdateSchema = z.object({
  content: homeSchema,
  revision: z.number().int().positive(),
});
export function parseInput<T>(schema: z.ZodType<T>, input: unknown): T {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw new AppError(`${issue.path.join(" → ")}: ${issue.message}`);
  }
  return parsed.data;
}
