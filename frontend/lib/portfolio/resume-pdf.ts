import fs from 'node:fs';
import path from 'node:path';

import PDFDocument from 'pdfkit';

import {
  formatExperiencePeriod,
  getExperienceTypeLabel,
  getExperienceTypeTheme,
} from '@/lib/experience/utils';
import { absoluteUrl } from '@/lib/site';
import { normalizeImageUrl } from '@/lib/utils/image';

import type { Experience, Project } from '@/lib/types/api';
import type { ResumeSnapshot } from './build-resume-snapshot';
import {
  extractExperienceHighlights,
  normalizeResumeStringArray,
} from './resume-content';

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const PAGE_MARGIN_X = 44;
const PAGE_MARGIN_TOP = 38;
const PAGE_MARGIN_BOTTOM = 38;
const CONTENT_WIDTH = PAGE_WIDTH - PAGE_MARGIN_X * 2;
const COLORS = {
  text: '#0F172A',
  muted: '#334155',
  subtle: '#475569',
  rule: '#CBD5E1',
  panel: '#F8FAFC',
  panelStroke: '#D6E2EC',
  accent: '#0F766E',
};

function resolveFontPath(
  candidates: string[],
  missingMessage: string,
): string {
  const resolved = candidates.find((candidate) => fs.existsSync(candidate));
  if (!resolved) {
    throw new Error(missingMessage);
  }

  return resolved;
}

function resolveFontPaths(): { serif: string; sans: string } {
  const serif = resolveFontPath(
    [
      path.join(process.cwd(), 'public', 'fonts', 'AppleMyungjo.ttf'),
      path.join(process.cwd(), '..', 'frontend', 'public', 'fonts', 'AppleMyungjo.ttf'),
      '/System/Library/Fonts/Supplemental/AppleMyungjo.ttf',
      '/usr/share/fonts/truetype/nanum/NanumMyeongjo.ttf',
    ],
    'A Korean serif font is required to generate the resume PDF.',
  );

  const sans = resolveFontPath(
    [
      '/System/Library/Fonts/Supplemental/AppleGothic.ttf',
      '/System/Library/Fonts/AppleSDGothicNeo.ttc',
      '/usr/share/fonts/truetype/nanum/NanumGothic.ttf',
    ],
    'A Korean sans-serif font is required to generate the resume PDF.',
  );

  return { serif, sans };
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

function shortenLink(value?: string | null): string {
  const stripped = cleanText(value).replace(/^https?:\/\//i, '').replace(/\/$/, '');

  try {
    return decodeURIComponent(stripped);
  } catch {
    return stripped;
  }
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

function drawFooter(doc: PDFKit.PDFDocument) {
  const range = doc.bufferedPageRange();
  for (let index = 0; index < range.count; index += 1) {
    doc.switchToPage(index);
    doc
      .font('resumeSans')
      .fontSize(9)
      .fillColor(COLORS.subtle)
      .text(`${index + 1} / ${range.count}`, PAGE_MARGIN_X, PAGE_HEIGHT - PAGE_MARGIN_BOTTOM + 8, {
        width: CONTENT_WIDTH,
        align: 'right',
      });
  }
}

function drawSectionHeading(
  doc: PDFKit.PDFDocument,
  title: string,
  y: number,
): number {
  doc.font('resumeSans').fontSize(12.5).fillColor(COLORS.text).text(title, PAGE_MARGIN_X, y, {
    width: 130,
  });

  const titleWidth = doc.widthOfString(title);
  doc
    .save()
    .lineWidth(0.9)
    .strokeColor(COLORS.rule)
    .moveTo(PAGE_MARGIN_X + titleWidth + 14, y + 8)
    .lineTo(PAGE_MARGIN_X + CONTENT_WIDTH, y + 8)
    .stroke()
    .restore();

  return y + 22;
}

function measureBulletItem(
  doc: PDFKit.PDFDocument,
  item: string,
  width: number,
  fontSize: number,
): number {
  doc.font('resumeSans').fontSize(fontSize);
  return doc.heightOfString(item, {
    width: width - 14,
    lineGap: 3,
  });
}

function drawBulletList(
  doc: PDFKit.PDFDocument,
  items: string[],
  y: number,
  width = CONTENT_WIDTH,
  fontSize = 10.5,
): number {
  let cursor = y;

  for (const item of items) {
    doc
      .save()
      .roundedRect(PAGE_MARGIN_X, cursor + 5, 5, 5, 2.5)
      .fill(COLORS.accent)
      .restore();

    doc
      .font('resumeSans')
      .fontSize(fontSize)
      .fillColor(COLORS.text)
      .text(item, PAGE_MARGIN_X + 14, cursor, {
        width: width - 14,
        lineGap: 3,
      });

    cursor = doc.y + 8;
  }

  return cursor;
}

function drawHeader(
  doc: PDFKit.PDFDocument,
  snapshot: ResumeSnapshot,
  photoBuffer: Buffer | null,
): number {
  const { settings } = snapshot;
  const hasPhoto = Boolean(settings.showPhoto && photoBuffer);
  const photoBoxWidth = hasPhoto ? 108 : 0;
  const gap = hasPhoto ? 22 : 0;
  const textWidth = CONTENT_WIDTH - photoBoxWidth - gap;
  const photoX = PAGE_MARGIN_X + textWidth + gap;
  const topY = PAGE_MARGIN_TOP;

  doc
    .font('resumeSerif')
    .fontSize(28)
    .fillColor(COLORS.text)
    .text(settings.name || snapshot.profile.name || '이름 미기재', PAGE_MARGIN_X, topY, {
      width: textWidth,
    });

  let cursor = doc.y + 2;

  doc
    .font('resumeSans')
    .fontSize(14)
    .fillColor(COLORS.muted)
    .text(settings.title || snapshot.profile.title || 'Backend Engineer', PAGE_MARGIN_X, cursor, {
      width: textWidth,
    });
  cursor = doc.y + 8;

  const contactPrimary = unique([settings.location, settings.email]).join('  |  ');
  const contactSecondary = unique([shortenLink(settings.github), shortenLink(settings.linkedin)]).join('  |  ');

  if (contactPrimary) {
    doc.font('resumeSans').fontSize(9.8).fillColor(COLORS.subtle).text(contactPrimary, PAGE_MARGIN_X, cursor, {
      width: textWidth,
    });
    cursor = doc.y + 3;
  }

  if (contactSecondary) {
    doc.font('resumeSans').fontSize(9.8).fillColor(COLORS.subtle).text(contactSecondary, PAGE_MARGIN_X, cursor, {
      width: textWidth,
    });
    cursor = doc.y + 8;
  }

  const headline = clampText(
    cleanText(
      settings.headline ||
        snapshot.profile.subtitle ||
        snapshot.profile.description ||
        snapshot.profile.about,
    ),
    180,
  );

  if (headline) {
    doc.font('resumeSans').fontSize(10.8).fillColor(COLORS.text).text(headline, PAGE_MARGIN_X, cursor, {
      width: textWidth,
      lineGap: 4,
    });
    cursor = doc.y + 4;
  }

  if (hasPhoto && photoBuffer) {
    doc
      .save()
      .roundedRect(photoX, topY + 2, photoBoxWidth, 126, 14)
      .fill(COLORS.panel)
      .restore();

    try {
      doc.image(photoBuffer, photoX + 8, topY + 10, {
        fit: [photoBoxWidth - 16, 108],
        align: 'center',
        valign: 'center',
      });
    } catch (error) {
      console.error('Failed to render resume photo:', error);
    }

    doc
      .save()
      .lineWidth(0.9)
      .strokeColor(COLORS.panelStroke)
      .roundedRect(photoX, topY + 2, photoBoxWidth, 126, 14)
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

function drawSkillChips(
  doc: PDFKit.PDFDocument,
  skills: string[],
  y: number,
): number {
  let cursorX = PAGE_MARGIN_X;
  let cursorY = y;
  const rowHeight = 28;

  doc.font('resumeSans').fontSize(9.8);

  for (const skill of skills) {
    const label = clampText(skill, 26);
    const chipWidth = Math.min(170, doc.widthOfString(label) + 24);

    if (cursorX + chipWidth > PAGE_MARGIN_X + CONTENT_WIDTH) {
      cursorX = PAGE_MARGIN_X;
      cursorY += rowHeight;
    }

    doc
      .save()
      .roundedRect(cursorX, cursorY, chipWidth, 22, 11)
      .fill(COLORS.panel)
      .restore();
    doc
      .save()
      .lineWidth(0.7)
      .strokeColor(COLORS.panelStroke)
      .roundedRect(cursorX, cursorY, chipWidth, 22, 11)
      .stroke()
      .restore();
    doc
      .font('resumeSans')
      .fontSize(9.8)
      .fillColor(COLORS.muted)
      .text(label, cursorX + 12, cursorY + 6, {
        width: chipWidth - 24,
        align: 'center',
      });

    cursorX += chipWidth + 8;
  }

  return cursorY + 30;
}

function buildExperienceCard(
  experience: Experience,
): {
  title: string;
  details: string;
  linkedProjectLine: string;
  bullets: string[];
  theme: ReturnType<typeof getExperienceTypeTheme>;
} {
  const theme = getExperienceTypeTheme(experience.type);
  const linkedProjectTitles = (experience.linkedProjects || [])
    .map((project) => cleanText(project.title))
    .filter(Boolean);

  const bullets = normalizeResumeStringArray(
    experience.resumeHighlights?.length
      ? experience.resumeHighlights
      : extractExperienceHighlights([experience.description], 2),
    2,
  );

  return {
    title: cleanText(experience.title) || '경험 정보',
    details: unique([
      experience.organization,
      formatExperiencePeriod(experience.startDate, experience.endDate),
    ]).join('  |  '),
    linkedProjectLine:
      linkedProjectTitles.length > 0
        ? clampText(
            `관련 프로젝트: ${linkedProjectTitles.slice(0, 3).join(', ')}${linkedProjectTitles.length > 3 ? ` 외 ${linkedProjectTitles.length - 3}개` : ''}`,
            92,
          )
        : '',
    bullets,
    theme,
  };
}

function measureExperienceCard(
  doc: PDFKit.PDFDocument,
  experience: Experience,
): number {
  const model = buildExperienceCard(experience);
  const contentWidth = CONTENT_WIDTH - 34;
  let height = 34;

  doc.font('resumeSans').fontSize(11.4);
  height += doc.heightOfString(model.title, { width: contentWidth - 88, lineGap: 2 });

  if (model.details) {
    doc.font('resumeSans').fontSize(9.4);
    height += doc.heightOfString(model.details, { width: contentWidth, lineGap: 2 }) + 6;
  }

  if (model.linkedProjectLine) {
    doc.font('resumeSans').fontSize(9.2);
    height += doc.heightOfString(model.linkedProjectLine, { width: contentWidth, lineGap: 2 }) + 6;
  }

  for (const bullet of model.bullets) {
    height += measureBulletItem(doc, bullet, contentWidth, 10) + 6;
  }

  return height + 12;
}

function drawExperienceCard(
  doc: PDFKit.PDFDocument,
  experience: Experience,
  y: number,
): number {
  const model = buildExperienceCard(experience);
  const cardHeight = measureExperienceCard(doc, experience);
  const boxX = PAGE_MARGIN_X;
  const boxY = y;
  const contentX = boxX + 18;
  const contentWidth = CONTENT_WIDTH - 36;

  doc
    .save()
    .roundedRect(boxX, boxY, CONTENT_WIDTH, cardHeight, 14)
    .fill('#FFFFFF')
    .restore();
  doc
    .save()
    .lineWidth(0.9)
    .strokeColor(COLORS.panelStroke)
    .roundedRect(boxX, boxY, CONTENT_WIDTH, cardHeight, 14)
    .stroke()
    .restore();
  doc
    .save()
    .roundedRect(boxX, boxY, 8, cardHeight, 6)
    .fill(model.theme.pdfColor)
    .restore();
  doc
    .save()
    .roundedRect(contentX, boxY + 14, 62, 20, 10)
    .fill(model.theme.pdfTint)
    .restore();

  doc.font('resumeSans').fontSize(9).fillColor(model.theme.pdfColor).text(
    getExperienceTypeLabel(experience.type),
    contentX,
    boxY + 19,
    {
      width: 62,
      align: 'center',
    },
  );

  doc.font('resumeSans').fontSize(11.4).fillColor(COLORS.text).text(
    model.title,
    contentX + 74,
    boxY + 15,
    {
      width: contentWidth - 74,
      lineGap: 2,
    },
  );

  let cursor = Math.max(doc.y, boxY + 34) + 2;

  if (model.details) {
    doc.font('resumeSans').fontSize(9.4).fillColor(COLORS.muted).text(model.details, contentX, cursor, {
      width: contentWidth,
      lineGap: 2,
    });
    cursor = doc.y + 4;
  }

  if (model.linkedProjectLine) {
    doc.font('resumeSans').fontSize(9.2).fillColor(COLORS.subtle).text(model.linkedProjectLine, contentX, cursor, {
      width: contentWidth,
      lineGap: 2,
    });
    cursor = doc.y + 5;
  }

  for (const bullet of model.bullets) {
    doc
      .save()
      .roundedRect(contentX, cursor + 5, 4, 4, 2)
      .fill(model.theme.pdfColor)
      .restore();
    doc.font('resumeSans').fontSize(10).fillColor(COLORS.text).text(bullet, contentX + 12, cursor, {
      width: contentWidth - 12,
      lineGap: 3,
    });
    cursor = doc.y + 6;
  }

  return boxY + cardHeight + 10;
}

function projectBulletLines(project: Project): string[] {
  const hasResumeSpecificContent = Boolean(
    cleanText(project.resumeTitle) ||
      cleanText(project.resumeSummary) ||
      (project.resumeHighlights || []).some((highlight) => cleanText(highlight)),
  );

  if (hasResumeSpecificContent) {
    return normalizeResumeStringArray(
      [
        cleanText(project.resumeSummary),
        ...(project.resumeHighlights || []),
      ],
      3,
    );
  }

  return extractExperienceHighlights(
    [
      project.description,
      project.problem,
      project.approach,
      ...(project.impactMetrics || []),
      project.outcomes,
    ],
    3,
  );
}

function measureProjectCard(
  doc: PDFKit.PDFDocument,
  project: Project,
): number {
  const bullets = projectBulletLines(project);
  const contentWidth = CONTENT_WIDTH - 28;
  let height = 28;

  doc.font('resumeSans').fontSize(12.4);
  height += doc.heightOfString(cleanText(project.resumeTitle || project.title) || '프로젝트', {
    width: contentWidth - 100,
    lineGap: 2,
  });

  const subline = unique([project.category, project.status]).join('  |  ');
  if (subline) {
    doc.font('resumeSans').fontSize(9.5);
    height += doc.heightOfString(subline, { width: contentWidth, lineGap: 2 }) + 6;
  }

  for (const bullet of bullets) {
    height += measureBulletItem(doc, bullet, contentWidth, 10.2) + 6;
  }

  const stackLine = cleanText((project.techStack || []).slice(0, 8).join(', '));
  if (stackLine) {
    doc.font('resumeSans').fontSize(9.2);
    height += doc.heightOfString(`기술 스택: ${stackLine}`, { width: contentWidth, lineGap: 2 }) + 4;
  }

  return height + 12;
}

function drawProjectCard(
  doc: PDFKit.PDFDocument,
  project: Project,
  y: number,
): number {
  const boxY = y;
  const cardHeight = measureProjectCard(doc, project);
  const period = formatPeriod(project.startDate, project.endDate);
  const title = cleanText(project.resumeTitle || project.title) || '프로젝트';
  const bullets = projectBulletLines(project);
  const contentX = PAGE_MARGIN_X + 16;
  const contentWidth = CONTENT_WIDTH - 32;

  doc
    .save()
    .roundedRect(PAGE_MARGIN_X, boxY, CONTENT_WIDTH, cardHeight, 14)
    .fill('#FFFFFF')
    .restore();
  doc
    .save()
    .lineWidth(0.9)
    .strokeColor(COLORS.panelStroke)
    .roundedRect(PAGE_MARGIN_X, boxY, CONTENT_WIDTH, cardHeight, 14)
    .stroke()
    .restore();

  doc.font('resumeSans').fontSize(12.4).fillColor(COLORS.text).text(title, contentX, boxY + 14, {
    width: contentWidth - 96,
    lineGap: 2,
  });

  if (period) {
    doc.font('resumeSans').fontSize(9.4).fillColor(COLORS.subtle).text(period, PAGE_MARGIN_X + CONTENT_WIDTH - 104, boxY + 16, {
      width: 88,
      align: 'right',
    });
  }

  let cursor = Math.max(doc.y, boxY + 32) + 2;
  const subline = unique([project.category, project.status]).join('  |  ');
  if (subline) {
    doc.font('resumeSans').fontSize(9.5).fillColor(COLORS.muted).text(subline, contentX, cursor, {
      width: contentWidth,
      lineGap: 2,
    });
    cursor = doc.y + 5;
  }

  for (const bullet of bullets) {
    doc
      .save()
      .roundedRect(contentX, cursor + 5, 4, 4, 2)
      .fill(COLORS.accent)
      .restore();
    doc.font('resumeSans').fontSize(10.2).fillColor(COLORS.text).text(bullet, contentX + 12, cursor, {
      width: contentWidth - 12,
      lineGap: 3,
    });
    cursor = doc.y + 6;
  }

  const stackLine = cleanText((project.techStack || []).slice(0, 8).join(', '));
  if (stackLine) {
    doc.font('resumeSans').fontSize(9.2).fillColor(COLORS.subtle).text(`기술 스택: ${stackLine}`, contentX, cursor, {
      width: contentWidth,
      lineGap: 2,
    });
    cursor = doc.y + 4;
  }

  return boxY + cardHeight + 12;
}

function drawPageOne(
  doc: PDFKit.PDFDocument,
  snapshot: ResumeSnapshot,
  photoBuffer: Buffer | null,
): void {
  let y = drawHeader(doc, snapshot, photoBuffer);

  y = drawSectionHeading(doc, '핵심 요약', y);
  y = snapshot.summaryBullets.length > 0
    ? drawBulletList(doc, snapshot.summaryBullets, y, CONTENT_WIDTH, 10.6)
    : (() => {
        doc.font('resumeSans').fontSize(10).fillColor(COLORS.muted).text('요약 정보가 없습니다.', PAGE_MARGIN_X, y, {
          width: CONTENT_WIDTH,
        });
        return doc.y + 8;
      })();

  y += 4;
  y = drawSectionHeading(doc, '핵심 기술', y);
  y = snapshot.featuredSkills.length > 0
    ? drawSkillChips(doc, snapshot.featuredSkills, y)
    : (() => {
        doc.font('resumeSans').fontSize(10).fillColor(COLORS.muted).text('선택된 기술이 없습니다.', PAGE_MARGIN_X, y, {
          width: CONTENT_WIDTH,
        });
        return doc.y + 10;
      })();

  y = drawSectionHeading(doc, '경험', y);

  if (snapshot.selectedExperiences.length === 0) {
    doc.font('resumeSans').fontSize(10).fillColor(COLORS.muted).text('노출 가능한 경험 정보가 없습니다.', PAGE_MARGIN_X, y, {
      width: CONTENT_WIDTH,
    });
    return;
  }

  const pageLimit = PAGE_HEIGHT - PAGE_MARGIN_BOTTOM - 26;
  let cursor = y;
  let drawnCount = 0;

  for (const experience of snapshot.selectedExperiences) {
    const nextHeight = measureExperienceCard(doc, experience);
    if (cursor + nextHeight > pageLimit) {
      break;
    }

    cursor = drawExperienceCard(doc, experience, cursor);
    drawnCount += 1;
  }

  if (drawnCount === 0) {
    doc.font('resumeSans').fontSize(10).fillColor(COLORS.muted).text('페이지에 표시할 경험 정보가 없습니다.', PAGE_MARGIN_X, y, {
      width: CONTENT_WIDTH,
    });
  }
}

function drawPageTwo(doc: PDFKit.PDFDocument, snapshot: ResumeSnapshot): void {
  doc.addPage();
  let y = PAGE_MARGIN_TOP;

  y = drawSectionHeading(doc, '선정 프로젝트', y);

  if (snapshot.selectedProjects.length === 0) {
    doc.font('resumeSans').fontSize(10).fillColor(COLORS.muted).text('이력서에 선택된 프로젝트가 없습니다.', PAGE_MARGIN_X, y, {
      width: CONTENT_WIDTH,
    });
    return;
  }

  const pageLimit = PAGE_HEIGHT - PAGE_MARGIN_BOTTOM - 26;
  let cursor = y;

  for (const project of snapshot.selectedProjects) {
    const nextHeight = measureProjectCard(doc, project);
    if (cursor + nextHeight > pageLimit) {
      break;
    }

    cursor = drawProjectCard(doc, project, cursor);
  }
}

export async function renderResumePdf(snapshot: ResumeSnapshot): Promise<Buffer> {
  const fonts = resolveFontPaths();
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
      font: fonts.sans,
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

    doc.registerFont('resumeSerif', fonts.serif);
    doc.registerFont('resumeSans', fonts.sans);
    doc.font('resumeSans');

    drawPageOne(doc, snapshot, photoBuffer);
    drawPageTwo(doc, snapshot);
    drawFooter(doc);
    doc.end();
  });
}
