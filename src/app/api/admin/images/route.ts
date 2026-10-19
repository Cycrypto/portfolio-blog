import { api } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { imageFromRequest, storePortfolioImage } from "@/lib/portfolio-images";

export const runtime = "nodejs";
export async function POST(request: Request) {
  return api(async () => {
    await requireAdmin(request, "home:write");
    return storePortfolioImage(await imageFromRequest(request));
  }, 201);
}
