import { homeSchema } from "./validation";
import type { HomeContent } from "./types";
export function isHomeDraft(value: unknown): value is HomeContent {
  return homeSchema.safeParse(value).success;
}
