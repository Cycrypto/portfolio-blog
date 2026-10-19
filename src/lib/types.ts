import type { z } from "zod";
import type { homeSchema } from "./validation";
export type HomeContent = z.infer<typeof homeSchema>;
export interface HomeDocument {
  content: HomeContent;
  revision: number;
  updatedAt: string;
}
export interface Principal {
  id: string;
  email: string;
  role: "admin";
}
