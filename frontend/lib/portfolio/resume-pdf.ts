import fs from 'node:fs';
import path from 'node:path';

import PDFDocument from 'pdfkit';

import {
  formatExperiencePeriod,
  getExperienceTypeLabel,
  getExperienceTypeTheme,
  sortExperiences,
} from '@/lib/experience/utils';
import { absoluteUrl } from '@/lib/site';
import { normalizeImageUrl } from '@/lib/utils/image';

import type { Project } from '@/lib/types/api';
import type { ResumeSnapshot } from './build-resume-snapshot';

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const PAGE_MARGIN_X = 48;
const PAGE_MARGIN_TOP = 42;
const PAGE_MARGIN_BOTTOM = 42;
const CONTENT_WIDTH = PAGE_WIDTH - PAGE_MARGIN_X * 2;
const COLORS = {
  text: '#111827',
  muted: '#4B5563',
  subtle: '#6B7280',
  rule: '#CBD5E1',
  panel: '#F8FAFC',
};

function resolveFontPath(): string {
  const candidates = [
    path.join(process.cwd(), 'public', 'fonts', 'AppleMyungjo.ttf'),
    path.join(process.cwd(), '..', 'frontend', 'public', 'fonts', 'AppleMyungjo.ttf'),
    '/System/Library/Fonts/Supplemental/AppleMyungjo.ttf',
    '/usr/share/fonts/truetype/nanum/NanumMyeongjo.ttf',
  ];

  const resolved = candidates.find((candidate) => fs.existsSync(candidate));
  if (!resolved) {
    throw new Error('A Korean serif font is required to generate the resume PDF.');
  }

  return resolved;
}

function cleanText(value?: string | null): string {
  return (value || '').replace(/\s+/g, ' ').trim();
}

function clampText(value: string, limit: number): string {
  if (value.length <= limit) {
    return value;
  }

  return `${value.slice(0, Math.max(0, limit - 3)).trimEnd()}...`;
}

function unique(values: Array<string | null | undefined>): string[] {
  return Array.from(new Set(values.map((value) => cleanText(value)).filter(Boolean)));
}

function formatDate(value?: string): string {
  if (!value) {
    return '';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return '';
  }

  return `${parsed.getFullYear()}.${String(parsed.getMonth() + 1).padStart(2, '0')}`;
}

function formatPeriod(startDate?: string, endDate?: string): string {
  const start = formatDate(startDate);
  const end = formatDate(endDate);

  if (!start && !end) {
    return '';
  }

  if (!start) {
    return end;
  }

  return `${start} - ${end || '현재'}`;
}

function toBulletItems(
  values: Array<string | null | undefined>,
  limit: number,
  charLimit: number,
): string[] {
  const items: string[] = [];

  for (const value of values) {
    const normalized = cleanText(value);
    if (!normalized) {
      continue;
    }

    const segments = normalized
      .replace(/[•·]/g, '-')
      .split(/\n+|\s+-\s+|(?<=[.!?])\s+|(?<=다\.)\s+/u)
      .map((segment) => clampText(cleanText(segment), charLimit))
      .filter(Boolean);

    for (const item of segments.length > 0 ? segments : [clampText(normalized, charLimit)]) {
      if (!items.includes(item)) {
        items.push(item);
      }

      if (items.length >= limit) {
        return items;
      }
    }
  }

  return items;
}

function resolvePhotoUrl(photoUrl?: string): string | null {
  const normalized = normalizeImageUrl(photoUrl);
  if (!normalized) {
    return null;
  }

  if (/^https?:\/\//i.test(normalized)) {
    return normalized;
  }

  if (normalized.startsWith('/')) {
    return absoluteUrl(normalized);
  }

  return normalized;
}

async function loadImageBuffer(photoUrl?: string): Promise<Buffer | null> {
  const resolvedUrl = resolvePhotoUrl(photoUrl);
  if (!resolvedUrl) {
    return null;
  }

  try {
    if (/^https?:\/\//i.test(resolvedUrl)) {
      const response = await fetch(resolvedUrl);
      if (!response.ok) {
        return null;
      }

      return Buffer.from(await response.arrayBuffer());
    }

    return fs.readFileSync(resolvedUrl);
  } catch (error) {
    console.error('Failed to load resume photo:', error);
    return null;
  }
}

function ensurePage(
  doc: PDFKit.PDFDocument,
  y: number,
  requiredHeight: number,
): number {
  const limit = PAGE_HEIGHT - PAGE_MARGIN_BOTTOM - 24;
  if (y + requiredHeight <= limit) {
    return y;
  }

  doc.addPage();
  doc.font('resume');
  return PAGE_MARGIN_TOP;
}

function drawSectionHeading(
  doc: PDFKit.PDFDocument,
  title: string,
  y: number,
): number {
  doc.fontSize(11).fillColor(COLORS.text).text(title, PAGE_MARGIN_X, y, {
    width: 120,
  });

  const titleWidth = doc.widthOfString(title);
  doc
    .save()
    .lineWidth(0.8)
    .strokeColor(COLORS.rule)
    .moveTo(PAGE_MARGIN_X + titleWidth + 12, y + 8)
    .lineTo(PAGE_MARGIN_X + CONTENT_WIDTH, y + 8)
    .stroke()
    .restore();

  return y + 18;
}

function drawBulletList(
  doc: PDFKit.PDFDocument,
  items: string[],
  y: number,
  width = CONTENT_WIDTH,
  fontSize = 10,
): number {
  let cursor = y;

  for (const item of items) {
    doc.fontSize(fontSize).fillColor(COLORS.text).text(`- ${item}`, PAGE_MARGIN_X, cursor, {
      width,
      lineGap: 2,
    });
    cursor = doc.y + 4;
  }

  return cursor;
}

function drawFooter(doc: PDFKit.PDFDocument) {
  const range = doc.bufferedPageRange();
  for (let index = 0; index < range.count; index += 1) {
    doc.switchToPage(index);
    doc
      .font('resume')
      .fontSize(9)
      .fillColor(COLORS.subtle)
      .text(`${index + 1} / ${range.count}`, PAGE_MARGIN_X, PAGE_HEIGHT - PAGE_MARGIN_BOTTOM + 6, {
        width: CONTENT_WIDTH,
        align: 'right',
      });
  }
}

function drawHeader(
  doc: PDFKit.PDFDocument,
  snapshot: ResumeSnapshot,
  photoBuffer: Buffer | null,
): number {
  const { settings } = snapshot;
  const hasPhoto = Boolean(settings.showPhoto && photoBuffer);
  const photoBoxWidth = hasPhoto ? 112 : 0;
  const gap = hasPhoto ? 24 : 0;
  const textWidth = CONTENT_WIDTH - photoBoxWidth - gap;
  const photoX = PAGE_MARGIN_X + textWidth + gap;
  const topY = PAGE_MARGIN_TOP;

  doc.fontSize(27).fillColor(COLORS.text).text(settings.name || snapshot.profile.name || '이름 미기재', PAGE_MARGIN_X, topY, {
    width: textWidth,
  });

  let cursor = doc.y + 2;

  doc.fontSize(12.5).fillColor(COLORS.muted).text(settings.title || snapshot.profile.title || 'Backend Engineer', PAGE_MARGIN_X, cursor, {
    width: textWidth,
  });
  cursor = doc.y + 6;

  const contactLine = unique([
    settings.location,
    settings.email,
    settings.github?.replace(/^https?:\/\//, '').replace(/\/$/, ''),
    settings.linkedin?.replace(/^https?:\/\//, '').replace(/\/$/, ''),
  ]).join('  |  ');

  if (contactLine) {
    doc.fontSize(9.5).fillColor(COLORS.subtle).text(contactLine, PAGE_MARGIN_X, cursor, {
      width: textWidth,
    });
    cursor = doc.y + 6;
  }

  const headline = clampText(
    cleanText(settings.headline || snapshot.profile.subtitle || snapshot.profile.description || snapshot.profile.about),
    170,
  );
  if (headline) {
    doc.fontSize(10.5).fillColor(COLORS.text).text(headline, PAGE_MARGIN_X, cursor, {
      width: textWidth,
      lineGap: 3,
    });
    cursor = doc.y + 4;
  }

  if (hasPhoto && photoBuffer) {
    doc
      .save()
      .roundedRect(photoX, topY, photoBoxWidth, 128, 14)
      .fill(COLORS.panel)
      .restore();

    try {
      doc.image(photoBuffer, photoX + 8, topY + 8, {
        fit: [photoBoxWidth - 16, 112],
        align: 'center',
        valign: 'center',
      });
    } catch (error) {
      console.error('Failed to render resume photo:', error);
    }

    doc
      .save()
      .lineWidth(0.8)
      .strokeColor(COLORS.rule)
      .roundedRect(photoX, topY, photoBoxWidth, 128, 14)
      .stroke()
      .restore();
  }

  const bottomY = hasPhoto ? Math.max(cursor, topY + 128) : cursor;

  doc
    .save()
    .lineWidth(1.2)
    .strokeColor(COLORS.rule)
    .moveTo(PAGE_MARGIN_X, bottomY + 8)
    .lineTo(PAGE_MARGIN_X + CONTENT_WIDTH, bottomY + 8)
    .stroke()
    .restore();

  return bottomY + 20;
}

function drawSkillsSection(
  doc: PDFKit.PDFDocument,
  skills: Array<{ name: string; level: number }>,
  y: number,
): number {
  const nextY = drawSectionHeading(doc, '핵심 기술', y);
  const orderedSkills = [...skills]
    .sort((a, b) => b.level - a.level)
    .map((skill) => cleanText(skill.name))
    .filter(Boolean)
    .slice(0, 12);

  if (orderedSkills.length === 0) {
    doc.fontSize(10).fillColor(COLORS.muted).text('정리된 기술 스택 정보가 없습니다.', PAGE_MARGIN_X, nextY, {
      width: CONTENT_WIDTH,
    });
    return doc.y + 18;
  }

  const columnWidth = (CONTENT_WIDTH - 24) / 2;
  const leftSkills = orderedSkills.filter((_, index) => index % 2 === 0);
  const rightSkills = orderedSkills.filter((_, index) => index % 2 === 1);

  doc.fontSize(10).fillColor(COLORS.text);
  doc.text(leftSkills.map((skill) => `- ${skill}`).join('\n'), PAGE_MARGIN_X, nextY, {
    width: columnWidth,
    lineGap: 3,
  });
  const leftBottom = doc.y;

  doc.text(rightSkills.map((skill) => `- ${skill}`).join('\n'), PAGE_MARGIN_X + columnWidth + 24, nextY, {
    width: columnWidth,
    lineGap: 3,
  });

  return Math.max(leftBottom, doc.y) + 18;
}

function drawExperienceSection(doc: PDFKit.PDFDocument, snapshot: ResumeSnapshot, y: number): number {
  let cursor = drawSectionHeading(doc, '경험', y);
  const experiences = sortExperiences(snapshot.experiences);

  if (experiences.length === 0) {
    doc.fontSize(10).fillColor(COLORS.muted).text('등록된 경험 정보가 없습니다.', PAGE_MARGIN_X, cursor, {
      width: CONTENT_WIDTH,
    });
    return doc.y + 18;
  }

  for (const experience of experiences) {
    const theme = getExperienceTypeTheme(experience.type);
    const title = cleanText(experience.title) || '경험 정보';
    const details = unique([
      experience.organization,
      formatExperiencePeriod(experience.startDate, experience.endDate),
    ]).join('  |  ');
    const bullets = toBulletItems([experience.description], 3, 116);
    const titleWidth = CONTENT_WIDTH - 138;
    const estimatedHeight =
      44 +
      doc.heightOfString(title, { width: titleWidth }) +
      (details ? doc.heightOfString(details, { width: CONTENT_WIDTH - 18 }) + 8 : 0) +
      bullets.length * 18;

    cursor = ensurePage(doc, cursor, estimatedHeight);

    doc
      .save()
      .roundedRect(PAGE_MARGIN_X, cursor + 2, 10, 10, 3)
      .fill(theme.pdfColor)
      .restore();

    doc
      .save()
      .roundedRect(PAGE_MARGIN_X + 18, cursor - 1, 56, 18, 9)
      .fill(theme.pdfTint)
      .restore();

    doc.fontSize(9).fillColor(theme.pdfColor).text(getExperienceTypeLabel(experience.type), PAGE_MARGIN_X + 18, cursor + 3, {
      width: 56,
      align: 'center',
    });

    doc.fontSize(11).fillColor(COLORS.text).text(title, PAGE_MARGIN_X + 84, cursor, {
      width: titleWidth,
    });

    cursor = Math.max(doc.y, cursor + 16) + 4;
    if (details) {
      doc.fontSize(9.5).fillColor(COLORS.muted).text(details, PAGE_MARGIN_X + 18, cursor, {
        width: CONTENT_WIDTH - 18,
      });
      cursor = doc.y + 5;
    }

    cursor = bullets.length > 0
      ? drawBulletList(doc, bullets, cursor, CONTENT_WIDTH, 10)
      : cursor;

    doc
      .save()
      .lineWidth(0.6)
      .strokeColor(COLORS.rule)
      .moveTo(PAGE_MARGIN_X, cursor + 4)
      .lineTo(PAGE_MARGIN_X + CONTENT_WIDTH, cursor + 4)
      .stroke()
      .restore();

    cursor += 16;
  }

  return cursor;
}

function projectBulletLines(project: Project): string[] {
  const summary = cleanText(
    project.resumeSummary || project.description || project.problem || project.longDescription,
  );

  const bullets = toBulletItems(
    [
      summary,
      ...(project.resumeHighlights || []),
      ...(project.impactMetrics || []),
      project.outcomes,
    ],
    3,
    118,
  );

  return bullets;
}

function drawProjectSection(doc: PDFKit.PDFDocument, snapshot: ResumeSnapshot, y: number): number {
  let cursor = drawSectionHeading(doc, '선정 프로젝트', y);

  if (snapshot.selectedProjects.length === 0) {
    doc.fontSize(10).fillColor(COLORS.muted).text('이력서에 선택된 프로젝트가 없습니다.', PAGE_MARGIN_X, cursor, {
      width: CONTENT_WIDTH,
    });
    return doc.y + 18;
  }

  for (const project of snapshot.selectedProjects) {
    cursor = ensurePage(doc, cursor, 110);
    const period = formatPeriod(project.startDate, project.endDate);
    const titleWidth = CONTENT_WIDTH - 124;

    doc.fontSize(11).fillColor(COLORS.text).text(
      cleanText(project.resumeTitle || project.title) || '프로젝트',
      PAGE_MARGIN_X,
      cursor,
      { width: titleWidth },
    );

    if (period) {
      doc.fontSize(9.5).fillColor(COLORS.subtle).text(period, PAGE_MARGIN_X + titleWidth + 16, cursor + 1, {
        width: 108,
        align: 'right',
      });
    }

    cursor = Math.max(doc.y, cursor + 16) + 3;

    const subline = unique([project.category, project.role, project.status]).join('  |  ');
    if (subline) {
      doc.fontSize(9.5).fillColor(COLORS.muted).text(subline, PAGE_MARGIN_X, cursor, {
        width: CONTENT_WIDTH,
      });
      cursor = doc.y + 5;
    }

    const bullets = projectBulletLines(project);
    if (bullets.length > 0) {
      cursor = drawBulletList(doc, bullets, cursor, CONTENT_WIDTH, 10);
    }

    const stackLine = cleanText((project.techStack || []).slice(0, 8).join(', '));
    if (stackLine) {
      doc.fontSize(9.5).fillColor(COLORS.subtle).text(`기술 스택: ${stackLine}`, PAGE_MARGIN_X, cursor, {
        width: CONTENT_WIDTH,
      });
      cursor = doc.y + 4;
    }

    doc
      .save()
      .lineWidth(0.6)
      .strokeColor(COLORS.rule)
      .moveTo(PAGE_MARGIN_X, cursor + 4)
      .lineTo(PAGE_MARGIN_X + CONTENT_WIDTH, cursor + 4)
      .stroke()
      .restore();

    cursor += 16;
  }

  return cursor;
}

export async function renderResumePdf(snapshot: ResumeSnapshot): Promise<Buffer> {
  const fontPath = resolveFontPath();
  const photoBuffer = snapshot.settings.showPhoto
    ? await loadImageBuffer(snapshot.settings.photoUrl)
    : null;

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 0,
      autoFirstPage: true,
      bufferPages: true,
      compress: true,
      font: fontPath,
      info: {
        Title: `${snapshot.settings.name || snapshot.profile.name || 'Portfolio'} Resume`,
        Author: snapshot.settings.name || snapshot.profile.name || 'Portfolio',
        Subject: 'Portfolio Resume PDF',
      },
    });

    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    doc.on('error', reject);
    doc.on('end', () => resolve(Buffer.concat(chunks)));

    doc.registerFont('resume', fontPath);
    doc.font('resume');

    let y = drawHeader(doc, snapshot, photoBuffer);

    const summaryBullets = toBulletItems(
      [
        snapshot.settings.headline,
        snapshot.profile.about,
        snapshot.profile.description,
      ],
      3,
      122,
    );

    y = drawSectionHeading(doc, '핵심 요약', y);
    y = summaryBullets.length > 0
      ? drawBulletList(doc, summaryBullets, y)
      : (() => {
          doc.fontSize(10).fillColor(COLORS.muted).text('요약 정보가 없습니다.', PAGE_MARGIN_X, y, {
            width: CONTENT_WIDTH,
          });
          return doc.y + 4;
        })();
    y += 14;

    y = drawSkillsSection(doc, snapshot.profile.skills || [], y);
    y = ensurePage(doc, y, 160);
    y = drawExperienceSection(doc, snapshot, y);
    y = ensurePage(doc, y, 220);
    drawProjectSection(doc, snapshot, y);

    drawFooter(doc);
    doc.end();
  });
}
