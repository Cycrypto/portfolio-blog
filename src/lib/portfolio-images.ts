import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";
import { dataDirectory } from "./repository";
import { AppError } from "./validation";

export const maxImageBytes = 10 * 1024 * 1024;
const formats: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpeg",
  "image/webp": "webp",
};

export async function imageFromRequest(request: Request): Promise<File> {
  const type = request.headers.get("content-type") ?? "";
  if (!type.startsWith("multipart/form-data;"))
    throw new AppError("이미지 파일을 선택해 주세요.", 415);
  const limit = maxImageBytes + 64 * 1024;
  if (Number(request.headers.get("content-length")) > limit)
    throw new AppError("이미지는 10MB 이하로 올려 주세요.", 413);
  const reader = request.body?.getReader();
  if (!reader) throw new AppError("이미지 파일이 없습니다.");
  const chunks: Uint8Array<ArrayBuffer>[] = [];
  let size = 0;
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      size += chunk.value.byteLength;
      if (size > limit) {
        await reader.cancel();
        throw new AppError("이미지는 10MB 이하로 올려 주세요.", 413);
      }
      chunks.push(new Uint8Array(chunk.value));
    }
  } finally {
    reader.releaseLock();
  }
  let form: FormData;
  try {
    form = await new Response(new Blob(chunks), {
      headers: { "content-type": type },
    }).formData();
  } catch {
    throw new AppError("업로드 형식을 확인해 주세요.");
  }
  const file = form.get("file");
  if (!(file instanceof File)) throw new AppError("이미지 파일이 없습니다.");
  return file;
}

export async function storePortfolioImage(file: File) {
  if (!formats[file.type])
    throw new AppError("PNG, JPG, WebP 이미지만 올릴 수 있습니다.", 415);
  if (!file.size || file.size > maxImageBytes)
    throw new AppError("이미지는 0바이트보다 크고 10MB 이하여야 합니다.", 413);
  let bytes: Buffer;
  let width: number;
  let height: number;
  try {
    const image = sharp(Buffer.from(await file.arrayBuffer()), {
      limitInputPixels: 25_000_000,
      failOn: "error",
      animated: false,
    });
    const meta = await image.metadata();
    if (meta.format !== formats[file.type] || (meta.pages ?? 1) > 1)
      throw new Error("Unsupported image");
    if (!meta.width || !meta.height || meta.width > 8192 || meta.height > 8192)
      throw new Error("Image dimensions exceeded");
    const output = await image.rotate().webp({ quality: 90 }).toBuffer({
      resolveWithObject: true,
    });
    bytes = output.data;
    width = output.info.width;
    height = output.info.height;
  } catch {
    throw new AppError(
      "이미지를 읽을 수 없습니다. 가로·세로 8192px, 총 2500만 픽셀 이하의 정지 이미지를 사용해 주세요.",
    );
  }
  if (bytes.byteLength > maxImageBytes)
    throw new AppError("변환된 이미지가 너무 큽니다.", 413);
  const name = `${createHash("sha256").update(bytes).digest("hex")}.webp`;
  const folder = join(dataDirectory(), "portfolio-images");
  await mkdir(folder, { recursive: true });
  try {
    await writeFile(join(folder, name), bytes, { flag: "wx", mode: 0o600 });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
  }
  return { url: `/portfolio-images/${name}`, width, height };
}

export async function readPortfolioImage(name: string) {
  if (!/^[a-f0-9]{64}\.webp$/.test(name)) return null;
  try {
    return await readFile(join(dataDirectory(), "portfolio-images", name));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}
