import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import sharp, { type Metadata } from "sharp";
import { api } from "@/lib/api";
import { requireOwner } from "@/lib/auth";
import { repository, dataDirectory } from "@/lib/repository";
import { AppError } from "@/lib/validation";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  return api(async () => {
    await requireOwner();
    return repository().listMedia();
  });
}
export async function POST(request: Request) {
  return api(async () => {
    await requireOwner(request);
    if (Number(request.headers.get("content-length") || 0) > 11 * 1024 * 1024)
      throw new AppError("10 MB 이하의 이미지를 선택해 주세요.", 413);
    const form = await request.formData();
    const file = form.get("file");
    const alt = String(form.get("alt") || "").trim();
    const caption = String(form.get("caption") || "").trim();
    if (!(file instanceof File))
      throw new AppError("이미지 파일을 선택해 주세요.");
    if (file.size > 10 * 1024 * 1024)
      throw new AppError("10 MB 이하의 이미지를 선택해 주세요.", 413);
    if (!alt || alt.length > 300 || caption.length > 500)
      throw new AppError("대체 텍스트는 필수이며 300자 이하로 입력해 주세요.");
    const buffer = Buffer.from(await file.arrayBuffer());
    let metadata: Metadata;
    try {
      metadata = await sharp(buffer, {
        limitInputPixels: 40_000_000,
      }).metadata();
    } catch {
      throw new AppError("올바른 이미지 파일이 아닙니다.");
    }
    if (!["jpeg", "png", "webp"].includes(metadata.format || ""))
      throw new AppError("JPG, PNG, WebP 이미지를 선택해 주세요.");
    const { data, info } = await sharp(buffer, { limitInputPixels: 40_000_000 })
      .rotate()
      .resize({
        width: 2400,
        height: 2400,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 88 })
      .toBuffer({ resolveWithObject: true });
    const id = randomUUID();
    const filename = `${id}.webp`;
    const folder = join(dataDirectory(), "uploads");
    await mkdir(folder, { recursive: true });
    await writeFile(join(folder, filename), data);
    const media = repository().addMedia({
      id,
      filename,
      originalName: file.name.slice(0, 200),
      alt,
      caption,
      width: info.width,
      height: info.height,
      byteSize: data.length,
      createdAt: new Date().toISOString(),
    });
    return { ...media, url: `/api/media/${id}` };
  }, 201);
}
