import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";
import {
  imageFromRequest,
  storePortfolioImage,
  readPortfolioImage,
  maxImageBytes,
} from "../src/lib/portfolio-images";
import { AppError } from "../src/lib/validation";

test("uploads decode and persist raster images without trusting file names or MIME alone", async () => {
  const folder = mkdtempSync(join(tmpdir(), "portfolio-images-"));
  const original = process.env.DATA_DIR;
  process.env.DATA_DIR = folder;
  const png = readFileSync("public/portfolio/oliver-rowland.png");
  const fails = (status: number) => (error: unknown) =>
    error instanceof AppError && error.status === status;
  try {
    const file = new File([png], "../../avatar.png", { type: "image/png" });
    const data = new FormData();
    data.set("file", file);
    const parsed = await imageFromRequest(
      new Request("https://junha.space/api/admin/images", {
        method: "POST",
        body: data,
      }),
    );
    const result = await storePortfolioImage(parsed);
    assert.match(result.url, /^\/portfolio-images\/[a-f0-9]{64}\.webp$/);
    const name = result.url.split("/").at(-1)!;
    const stored = await readPortfolioImage(name);
    assert.ok(stored);
    const meta = await sharp(stored).metadata();
    assert.equal(meta.format, "webp");
    assert.equal(meta.width, result.width);
    assert.equal(meta.exif, undefined);
    assert.deepEqual(await storePortfolioImage(file), result);
    assert.equal(await readPortfolioImage("../portfolio.sqlite"), null);
    assert.equal(await readPortfolioImage(`${"0".repeat(64)}.webp`), null);
    await assert.rejects(
      storePortfolioImage(
        new File(["<svg/ >"], "x.svg", { type: "image/svg+xml" }),
      ),
      fails(415),
    );
    await assert.rejects(
      storePortfolioImage(
        new File(["<svg/ >"], "fake.png", { type: "image/png" }),
      ),
      fails(400),
    );
    await assert.rejects(
      storePortfolioImage(new File([png], "fake.jpg", { type: "image/jpeg" })),
      fails(400),
    );
    await assert.rejects(
      storePortfolioImage(
        new File([new Uint8Array(maxImageBytes + 1)], "large.png", {
          type: "image/png",
        }),
      ),
      fails(413),
    );
    const oversized = new Request("https://junha.space/api/admin/images", {
      method: "POST",
      headers: {
        "content-type": "multipart/form-data; boundary=test",
        "content-length": String(maxImageBytes * 2),
      },
      body: "test",
    });
    await assert.rejects(imageFromRequest(oversized), fails(413));
  } finally {
    if (original === undefined) delete process.env.DATA_DIR;
    else process.env.DATA_DIR = original;
    rmSync(folder, { recursive: true, force: true });
  }
});
