import PDFDocument from "pdfkit";
import { join } from "node:path";
import { readFile } from "node:fs/promises";
import sharp from "sharp";
import {
  portfolioAssets,
  type PortfolioAssetKey,
} from "@/data/portfolio-assets";
import { skillLevels } from "@/components/portfolio";
import type { HomeContent } from "./types";
import { readPortfolioImage } from "./portfolio-images";

// The avatar can be an uploaded image, a bundled asset, or empty.
async function avatarPng(name: string): Promise<Buffer | null> {
  try {
    let bytes: Buffer | null = null;
    const uploaded = name.match(/^\/portfolio-images\/([a-f0-9]{64}\.webp)$/);
    if (uploaded) bytes = await readPortfolioImage(uploaded[1]);
    else if (Object.hasOwn(portfolioAssets, name))
      bytes = await readFile(
        join(
          process.cwd(),
          "public",
          portfolioAssets[name as PortfolioAssetKey][0],
        ),
      );
    if (!bytes) return null;
    return await sharp(bytes)
      .resize(300, 300, { fit: "cover", position: "top" })
      .flatten({ background: "#FAE2D8" })
      .png()
      .toBuffer();
  } catch {
    return null;
  }
}

// Renders the saved portfolio content as an A4 résumé (the Pencil "CV A"
// design) so the CV button always matches what the site shows.
export async function renderCv(content: HomeContent): Promise<Buffer> {
  const fonts = join(process.cwd(), "public", "fonts");
  const { profile } = content.intro;
  const avatar = profile.avatar ? await avatarPng(profile.avatar) : null;
  const doc = new PDFDocument({
    size: "A4",
    margins: { top: 30, bottom: 26, left: 52, right: 52 },
    info: { Title: `${profile.name} — CV`, Author: profile.name },
  });
  doc.registerFont("body", join(fonts, "Pretendard-Regular.otf"));
  doc.registerFont("display", join(fonts, "Habibi-Regular.ttf"));
  doc.registerFont("displayKo", join(fonts, "NanumMyeongjo-Regular.ttf"));
  doc.registerFont("displayKoBold", join(fonts, "NanumMyeongjo-Bold.ttf"));
  const ink = "#1A0A06";
  const muted = "#75635A";
  const coral = "#E55639";
  const line = "#DECEC1";
  const soft = "#FBF5EF";
  const hasHangul = (s: string) => /[\u3131-\uD79D]/.test(s);
  const display = (s: string, bold = false) =>
    hasHangul(s) ? (bold ? "displayKoBold" : "displayKo") : "display";
  const width = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const left = doc.page.margins.left;
  const bottom = () => doc.page.height - doc.page.margins.bottom;
  const ensureSpace = (height: number) => {
    if (doc.y + height > bottom()) doc.addPage();
  };
  const section = (title: string) => {
    ensureSpace(48);
    doc.y += 0;
    doc
      .font(display(title))
      .fontSize(13.5)
      .fillColor(ink)
      .text(title, left, doc.y, { width });
    const y = doc.y + 3;
    doc
      .moveTo(left, y)
      .lineTo(left + width, y)
      .lineWidth(0.6)
      .strokeColor(line)
      .stroke();
    doc.y = y + 5;
  };
  const bullets = (items: string[]) => {
    for (const item of items) {
      ensureSpace(16);
      const y = doc.y;
      doc
        .font("body")
        .fontSize(8.8)
        .fillColor(coral)
        .text("•", left, y, { width: 10, lineBreak: false });
      doc
        .fillColor(ink)
        .text(item, left + 12, y, { width: width - 12, lineGap: 0.5 });
    }
  };
  const timeline = (data: HomeContent["experience"]) => {
    for (const company of data.companies) {
      for (const role of company.roles) {
        ensureSpace(64);
        const top = doc.y;
        doc
          .font("body")
          .fontSize(9)
          .fillColor(muted)
          .text(role.period, left, top + 2, {
            width,
            align: "right",
            lineBreak: false,
          });
        doc
          .font(display(role.title, true))
          .fontSize(11.5)
          .fillColor(ink)
          .text(role.title, left, top, { width: width - 120 });
        doc
          .font("body")
          .fontSize(8.8)
          .fillColor(muted)
          .text(
            [company.name, role.employmentType].filter(Boolean).join(" · "),
            { width: width - 120 },
          );
        if (role.description) {
          doc.y += 2;
          doc
            .fontSize(8.8)
            .fillColor(ink)
            .text(role.description.replace(/\n\s*\n/g, "\n"), left, doc.y, {
              width,
              lineGap: 0.8,
              paragraphGap: 2,
            });
        }
        if (role.highlights.length) {
          doc.y += 3;
          bullets(role.highlights);
        }
        doc.y += 5;
      }
    }
  };

  // Header: accent bar, avatar and name on the left, contact lines on the right.
  const top = doc.page.margins.top;
  doc.rect(left, top, 48, 3).fill(coral);
  const headTop = top + 22;
  let textLeft = left;
  if (avatar) {
    const size = 64;
    doc.save();
    doc.circle(left + size / 2, headTop + size / 2, size / 2).clip();
    doc.image(avatar, left, headTop, { width: size, height: size });
    doc.restore();
    textLeft = left + size + 18;
  }
  const contact = [
    ...content.contact.channels.map((c) => c.value),
    ...content.contact.networks
      .filter((n) => n.href)
      .map((n) =>
        n.href.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, ""),
      ),
  ];
  doc.font("body").fontSize(9).fillColor(muted);
  contact.forEach((c, i) =>
    doc.text(c, left, headTop + 4 + i * 13, {
      width,
      align: "right",
      lineBreak: false,
    }),
  );
  const nameWidth = width - 180 - (textLeft - left);
  doc
    .font(display(profile.name, true))
    .fontSize(26)
    .fillColor(ink)
    .text(profile.name, textLeft, headTop + 6, {
      width: nameWidth,
      lineBreak: false,
    });
  if (profile.role)
    doc
      .font("body")
      .fontSize(11.5)
      .fillColor(muted)
      .text(profile.role, textLeft, headTop + 42, {
        width: nameWidth,
        lineBreak: false,
      });
  doc.y = headTop + Math.max(avatar ? 64 : 0, 60) + 4;
  if (profile.facts.length)
    doc
      .font("body")
      .fontSize(9.5)
      .fillColor(coral)
      .text(profile.facts.map((f) => f.text).join("   ·   "), left, doc.y, {
        width,
      });

  section(content.about.label || "About");
  doc
    .font("body")
    .fontSize(9.2)
    .fillColor(ink)
    .text(content.about.description.replace(/\n\s*\n/g, "\n"), left, doc.y, {
      width,
      lineGap: 1.2,
      paragraphGap: 3,
    });

  if (content.experience.companies.length) {
    section(content.experience.label || "Experience");
    timeline(content.experience);
  }
  if (content.activities.companies.length) {
    section(content.activities.label || "Activities");
    timeline(content.activities);
  }
  if (content.skills.items.length || content.skills.technologies.length) {
    ensureSpace(80);
    section(content.skills.label || "Skills");
    // Chips flow left to right and wrap, like the site's tag list.
    doc.font("body").fontSize(8.5);
    let x = left;
    let y = doc.y;
    for (const s of content.skills.items) {
      const label = skillLevels[s.level]
        ? `${s.name} · ${skillLevels[s.level]}`
        : s.name;
      const w = doc.widthOfString(label) + 14;
      if (x + w > left + width) {
        x = left;
        y += 21;
      }
      if (y + 22 > bottom()) {
        doc.addPage();
        y = doc.y;
        x = left;
      }
      doc.roundedRect(x, y, w, 18, 3).fill(soft);
      doc.fillColor(ink).text(label, x + 7, y + 4.5, { lineBreak: false });
      x += w + 6;
    }
    doc.y = content.skills.items.length ? y + 22 : y;
    if (content.skills.technologies.length)
      doc
        .font("body")
        .fontSize(9.5)
        .fillColor(muted)
        .text(
          `${content.skills.technologiesLabel || "Tools"}  ${content.skills.technologies.map((t) => t.name).join(" · ")}`,
          left,
          doc.y,
          { width },
        );
    doc.y += 6;
  }
  if (content.certifications.items.length) {
    section(content.certifications.label || "Certifications");
    for (const item of content.certifications.items)
      doc
        .font("body")
        .fontSize(10)
        .fillColor(ink)
        .text(
          [item.title, item.issuer, item.issued].filter(Boolean).join(" · "),
          left,
          doc.y,
          { width },
        );
  }
  if (content.languages.items.length) {
    ensureSpace(40);
    section(content.languages.label || "Languages");
    doc
      .font("body")
      .fontSize(10)
      .fillColor(ink)
      .text(
        content.languages.items
          .map((l) => [l.name, l.proficiency].filter(Boolean).join(" — "))
          .join("     ·     "),
        left,
        doc.y,
        { width },
      );
  }

  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    doc.end();
  });
}
