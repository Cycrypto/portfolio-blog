import { SignJWT } from "jose";
import { AppError } from "./validation";

export interface GhostTag {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  visibility: "public" | "internal";
  updated_at?: string;
}
export interface GhostPost {
  id: string;
  title: string;
  status: "published" | "draft" | "scheduled";
  published_at: string | null;
  updated_at: string;
  tags: GhostTag[];
}
interface GhostResponse<T> {
  posts?: T[];
  tags?: T[];
  meta?: { pagination: { next: number | null } };
}

export class GhostAdmin {
  readonly blogUrl: string;
  private key: string;
  constructor() {
    const rawUrl = process.env.GHOST_ADMIN_URL?.trim();
    this.key = process.env.GHOST_ADMIN_API_KEY?.trim() || "";
    if (!rawUrl || !/^[a-f\d]{24}:[a-f\d]{64}$/i.test(this.key))
      throw new AppError(
        "블로그 연결 설정이 필요합니다. 서버에 Ghost Admin API를 연결해 주세요.",
        503,
      );
    try {
      const url = new URL(rawUrl);
      if (
        !["https:", "http:"].includes(url.protocol) ||
        url.username ||
        url.password ||
        url.search ||
        url.hash
      )
        throw new Error();
      this.blogUrl = url.href.replace(/\/$/, "");
    } catch {
      throw new AppError("블로그 주소 설정을 확인해 주세요.", 503);
    }
  }

  async request<T>(
    path: string,
    method = "GET",
    body?: unknown,
  ): Promise<GhostResponse<T>> {
    const [id, secret] = this.key.split(":");
    const token = await new SignJWT({})
      .setProtectedHeader({ alg: "HS256", kid: id, typ: "JWT" })
      .setIssuedAt()
      .setExpirationTime("5m")
      .setAudience("/admin/")
      .sign(Buffer.from(secret, "hex"));
    let response: Response;
    try {
      response = await fetch(`${this.blogUrl}/ghost/api/admin/${path}`, {
        method,
        headers: {
          Authorization: `Ghost ${token}`,
          "Accept-Version": "v6.0",
          "Content-Type": "application/json",
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        cache: "no-store",
        redirect: "error",
        signal: AbortSignal.timeout(15000),
      });
    } catch {
      throw new AppError(
        "블로그에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.",
        502,
      );
    }
    if (!response.ok) {
      if (response.status === 409)
        throw new AppError(
          "다른 곳에서 글이 변경됐습니다. 새로 불러온 뒤 다시 저장해 주세요.",
          409,
        );
      if ([401, 403].includes(response.status))
        throw new AppError(
          "블로그 연결 권한을 확인해 주세요. Ghost Admin API 키 설정이 필요합니다.",
          502,
        );
      throw new AppError(
        "블로그에서 변경을 처리하지 못했습니다. 새로 불러온 뒤 다시 시도해 주세요.",
        502,
      );
    }
    return response.json();
  }

  async browse<T>(
    resource: "posts" | "tags",
    options: Record<string, string> = {},
  ): Promise<T[]> {
    const entries: T[] = [];
    let page: number | null = 1;
    while (page !== null) {
      const query: URLSearchParams = new URLSearchParams({
        ...options,
        limit: "100",
        page: String(page),
      });
      const data: GhostResponse<T> = await this.request<T>(
        `${resource}/?${query}`,
      );
      entries.push(...(data[resource] || []));
      page = data.meta?.pagination.next ?? null;
    }
    return entries;
  }
}
