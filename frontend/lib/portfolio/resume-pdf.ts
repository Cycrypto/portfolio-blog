import fs from 'node:fs';
import path from 'node:path';

import PDFDocument from 'pdfkit';

import {
  formatExperiencePeriod,
  getCareerDurationLabel,
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
const PAGE_MARGIN_TOP = 36;
const PAGE_MARGIN_BOTTOM = 34;
const CONTENT_WIDTH = PAGE_WIDTH - PAGE_MARGIN_X * 2;
const CONTENT_LIMIT_Y = PAGE_HEIGHT - PAGE_MARGIN_BOTTOM;

const COLORS = {
  ink: '#172033',
  body: '#334155',
  muted: '#5F6F82',
  faint: '#94A3B8',
  rule: '#D9E2EA',
  accent: '#547792',
  accentStrong: '#38556D',
  accentSoft: '#EDF4F7',
  accentLine: '#C7D6E1',
  photoStroke: '#CBD5E1',
};

interface LayoutState {
  cursor: number;
}

interface ExperienceModel {
  label: string;
  title: string;
  organization: string;
  period: string;
  relatedProjects: string;
  bullets: string[];
  themeColor: string;
  themeTint: string;
}

interface ProjectModel {
  title: string;
  summary: string;
  meta: string;
  bullets: string[];
  stack: string;
}

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
      path.join(
        process.cwd(),
        '..',
        'frontend',
        'public',
        'fonts',
        'AppleMyungjo.ttf',
      ),
      '/System/Library/Fonts/Supplemental/AppleMyungjo.ttf',
      '/usr/share/fonts/truetype/nanum/NanumMyeongjo.ttf',
    ],
    'A Korean serif font is required to generate the resume PDF.',
  );

  const sansCandidates = [
    path.join(process.cwd(), 'public', 'fonts', 'AppleGothic.ttf'),
    path.join(
      process.cwd(),
      '..',
      'frontend',
      'public',
      'fonts',
      'AppleGothic.ttf',
    ),
    '/System/Library/Fonts/Supplemental/AppleGothic.ttf',
    '/System/Library/Fonts/AppleSDGothicNeo.ttc',
    '/usr/share/fonts/truetype/nanum/NanumGothic.ttf',
  ];

  const sans =
    sansCandidates.find((candidate) => fs.existsSync(candidate)) || serif;

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
  return Array.from(
    new Set(values.map((value) => cleanText(value)).filter(Boolean)),
  );
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

function formatProjectStatus(status?: string | null): string {
  switch (cleanText(status).toLowerCase()) {
    case 'completed':
      return '완료';
    case 'active':
    case 'in-progress':
      return '진행중';
    case 'planned':
      return '계획';
    default:
      return cleanText(status);
  }
}

function formatProjectCategory(category?: string | null): string {
  const normalized = cleanText(category).toLowerCase();

  switch (normalized) {
    case 'ai':
      return 'AI';
    case 'web':
      return 'Web';
    case 'tool':
      return 'Tool';
    default:
      return cleanText(category);
  }
}

function shortenLink(value?: string | null): string {
  const stripped = cleanText(value)
    .replace(/^https?:\/\//i, '')
    .replace(/\/$/, '');

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

function addPage(doc: PDFKit.PDFDocument, state: LayoutState): void {
  doc.addPage();
  state.cursor = PAGE_MARGIN_TOP;
}

function ensureSpace(
  doc: PDFKit.PDFDocument,
  state: LayoutState,
  neededHeight: number,
): void {
  if (state.cursor + neededHeight <= CONTENT_LIMIT_Y) {
    return;
  }

  addPage(doc, state);
}

function drawFooter(
  doc: PDFKit.PDFDocument,
  snapshot: ResumeSnapshot,
): void {
  const range = doc.bufferedPageRange();
  const label = `${
    snapshot.settings.name || snapshot.profile.name || 'Resume'
  } Resume`;

  for (let index = 0; index < range.count; index += 1) {
    doc.switchToPage(index);
    doc
      .font('resumeSans')
      .fontSize(8.6)
      .fillColor(COLORS.faint)
      .text(label, PAGE_MARGIN_X, PAGE_HEIGHT - PAGE_MARGIN_BOTTOM + 10, {
        width: CONTENT_WIDTH / 2,
      });

    doc
      .font('resumeSans')
      .fontSize(8.6)
      .fillColor(COLORS.faint)
      .text(`${index + 1} / ${range.count}`, PAGE_MARGIN_X, PAGE_HEIGHT - PAGE_MARGIN_BOTTOM + 10, {
        width: CONTENT_WIDTH / 2,
        align: 'right',
      });
  }
}

function measureText(
  doc: PDFKit.PDFDocument,
  fontName: string,
  fontSize: number,
  value: string,
  width: number,
  lineGap = 2,
): number {
  doc.font(fontName).fontSize(fontSize);
  return doc.heightOfString(value, {
    width,
    lineGap,
  });
}

function drawRule(
  doc: PDFKit.PDFDocument,
  y: number,
  x = PAGE_MARGIN_X,
  width = CONTENT_WIDTH,
): void {
  doc
    .save()
    .lineWidth(0.8)
    .strokeColor(COLORS.rule)
    .moveTo(x, y)
    .lineTo(x + width, y)
    .stroke()
    .restore();
}

function drawPill(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  label: string,
  fillColor: string,
  textColor: string,
): number {
  doc.font('resumeSans').fontSize(8.1);
  const textWidth = doc.widthOfString(label, {
    characterSpacing: 0.7,
  });
  const width = textWidth + 18;

  doc
    .save()
    .roundedRect(x, y, width, 17, 8.5)
    .fill(fillColor)
    .restore();

  doc
    .font('resumeSans')
    .fontSize(8.1)
    .fillColor(textColor)
    .text(label, x + 9, y + 4.6, {
      width: textWidth + 1,
      characterSpacing: 0.7,
    });

  return width;
}

function drawSectionHeading(
  doc: PDFKit.PDFDocument,
  state: LayoutState,
  title: string,
  continued = false,
): void {
  ensureSpace(doc, state, 34);
  const heading = continued ? `${title} (계속)` : title;

  doc
    .font('resumeSerif')
    .fontSize(15.2)
    .fillColor(COLORS.ink)
    .text(heading, PAGE_MARGIN_X, state.cursor, {
      width: 170,
    });

  const titleWidth = doc.widthOfString(heading);
  drawRule(
    doc,
    state.cursor + 11,
    PAGE_MARGIN_X + titleWidth + 16,
    Math.max(0, CONTENT_WIDTH - titleWidth - 16),
  );
  state.cursor += 24;
}

function drawBulletLine(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  width: number,
  text: string,
  fontSize = 10.2,
  bulletColor = COLORS.accent,
  bulletOffset = 13,
): number {
  doc
    .save()
    .circle(x + 3, y + 9, 2.1)
    .fill(bulletColor)
    .restore();

  doc
    .font('resumeSans')
    .fontSize(fontSize)
    .fillColor(COLORS.body)
    .text(text, x + bulletOffset, y, {
      width: width - bulletOffset,
      lineGap: 3,
    });

  return doc.y;
}

function drawHeaderInfo(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  width: number,
  label: string,
  value: string,
): number {
  doc
    .font('resumeSans')
    .fontSize(7.5)
    .fillColor(COLORS.faint)
    .text(label, x, y, {
      width,
      characterSpacing: 1,
    });

  const valueY = doc.y + 2;

  doc
    .font('resumeSans')
    .fontSize(9.4)
    .fillColor(COLORS.body)
    .text(value, x, valueY, {
      width,
      lineGap: 2,
    });

  return doc.y;
}

function drawHeader(
  doc: PDFKit.PDFDocument,
  snapshot: ResumeSnapshot,
  photoBuffer: Buffer | null,
  state: LayoutState,
): void {
  const hasPhoto = Boolean(snapshot.settings.showPhoto && photoBuffer);
  const railWidth = hasPhoto ? 176 : 190;
  const columnGap = 26;
  const photoWidth = hasPhoto ? 82 : 0;
  const textWidth = CONTENT_WIDTH - railWidth - columnGap;
  const textX = PAGE_MARGIN_X;
  const railX = PAGE_MARGIN_X + textWidth + columnGap;
  const topY = state.cursor;

  const name = snapshot.settings.name || snapshot.profile.name || '이름 미기재';
  const title =
    snapshot.settings.title || snapshot.profile.title || 'Backend Engineer';
  const headline = clampText(
    cleanText(
      snapshot.settings.headline ||
        snapshot.profile.subtitle ||
        snapshot.profile.description ||
        snapshot.profile.about,
    ),
    210,
  );

  const contactItems = [
    snapshot.settings.location
      ? { label: 'LOCATION', value: snapshot.settings.location }
      : null,
    snapshot.settings.email
      ? { label: 'EMAIL', value: snapshot.settings.email }
      : null,
    snapshot.settings.github
      ? { label: 'GITHUB', value: shortenLink(snapshot.settings.github) }
      : null,
    snapshot.settings.linkedin
      ? { label: 'LINKEDIN', value: shortenLink(snapshot.settings.linkedin) }
      : null,
  ].filter(
    (
      item,
    ): item is {
      label: string;
      value: string;
    } => Boolean(item),
  );

  const skillText = snapshot.featuredSkills
    .map((skill) => clampText(skill, 18))
    .join(' · ');

  drawPill(
    doc,
    textX,
    topY,
    'RESUME',
    COLORS.accentSoft,
    COLORS.accentStrong,
  );

  let textCursor = topY + 28;

  doc
    .font('resumeSerif')
    .fontSize(31)
    .fillColor(COLORS.ink)
    .text(name, textX, textCursor, {
      width: textWidth,
    });

  textCursor = doc.y + 4;

  doc
    .font('resumeSans')
    .fontSize(15.2)
    .fillColor(COLORS.accentStrong)
    .text(title, textX, textCursor, {
      width: textWidth,
    });

  textCursor = doc.y + 9;

  if (headline) {
    doc
      .font('resumeSans')
      .fontSize(11.1)
      .fillColor(COLORS.body)
      .text(headline, textX, textCursor, {
        width: textWidth,
        lineGap: 4,
      });
    textCursor = doc.y;
  }

  let railCursor = topY;

  if (hasPhoto && photoBuffer) {
    try {
      doc.image(photoBuffer, railX, railCursor, {
        fit: [photoWidth, 96],
        align: 'center',
        valign: 'center',
      });
    } catch (error) {
      console.error('Failed to render resume photo:', error);
    }

    doc
      .save()
      .lineWidth(0.8)
      .strokeColor(COLORS.photoStroke)
      .roundedRect(railX, railCursor, photoWidth, 96, 12)
      .stroke()
      .restore();

    railCursor += 108;
  }

  if (contactItems.length > 0) {
    doc
      .font('resumeSans')
      .fontSize(7.6)
      .fillColor(COLORS.accentStrong)
      .text('CONTACT', railX, railCursor, {
        width: railWidth,
        characterSpacing: 1.4,
      });
    railCursor = doc.y + 6;

    for (const item of contactItems) {
      railCursor = drawHeaderInfo(
        doc,
        railX,
        railCursor,
        railWidth,
        item.label,
        item.value,
      ) + 8;
    }
  }

  if (skillText) {
    doc
      .font('resumeSans')
      .fontSize(7.6)
      .fillColor(COLORS.accentStrong)
      .text('CORE SKILLS', railX, railCursor, {
        width: railWidth,
        characterSpacing: 1.4,
      });

    const skillY = doc.y + 6;

    doc
      .font('resumeSans')
      .fontSize(9.4)
      .fillColor(COLORS.body)
      .text(skillText, railX, skillY, {
        width: railWidth,
        lineGap: 3,
      });

    railCursor = doc.y;
  }

  const headerBottom = Math.max(textCursor, railCursor);

  if (headerBottom > topY + 10) {
    doc
      .save()
      .lineWidth(1)
      .strokeColor(COLORS.accentLine)
      .moveTo(railX - 14, topY + 3)
      .lineTo(railX - 14, headerBottom)
      .stroke()
      .restore();
  }

  drawRule(doc, headerBottom + 10);
  state.cursor = headerBottom + 24;
}

function drawMetricsRow(
  doc: PDFKit.PDFDocument,
  snapshot: ResumeSnapshot,
  state: LayoutState,
): void {
  const stats = [
    {
      label: '실무 경력',
      value: getCareerDurationLabel(snapshot.selectedExperiences) || '정리 중',
    },
    {
      label: '대표 프로젝트',
      value: `${snapshot.selectedProjects.length}개`,
    },
    {
      label: '핵심 기술',
      value: `${snapshot.featuredSkills.length}개`,
    },
  ];

  ensureSpace(doc, state, 58);
  const topY = state.cursor;
  const columnWidth = CONTENT_WIDTH / stats.length;

  for (let index = 0; index < stats.length; index += 1) {
    const stat = stats[index];
    const x = PAGE_MARGIN_X + columnWidth * index;

    doc
      .font('resumeSans')
      .fontSize(8)
      .fillColor(COLORS.faint)
      .text(stat.label, x, topY, {
        width: columnWidth - 18,
        characterSpacing: 0.6,
      });

    doc
      .font('resumeSans')
      .fontSize(15.5)
      .fillColor(COLORS.ink)
      .text(stat.value, x, topY + 14, {
        width: columnWidth - 18,
      });

    if (index < stats.length - 1) {
      doc
        .save()
        .lineWidth(0.8)
        .strokeColor(COLORS.rule)
        .moveTo(x + columnWidth - 14, topY + 2)
        .lineTo(x + columnWidth - 14, topY + 34)
        .stroke()
        .restore();
    }
  }

  drawRule(doc, topY + 44);
  state.cursor = topY + 58;
}

function drawSummarySection(
  doc: PDFKit.PDFDocument,
  snapshot: ResumeSnapshot,
  state: LayoutState,
): void {
  drawSectionHeading(doc, state, '핵심 요약');

  if (snapshot.summaryBullets.length === 0) {
    doc
      .font('resumeSans')
      .fontSize(10.1)
      .fillColor(COLORS.muted)
      .text('요약 정보가 없습니다.', PAGE_MARGIN_X, state.cursor, {
        width: CONTENT_WIDTH,
      });
    state.cursor = doc.y + 14;
    return;
  }

  snapshot.summaryBullets.forEach((bullet, index) => {
    const height =
      measureText(
        doc,
        'resumeSans',
        10.7,
        bullet,
        CONTENT_WIDTH - 34,
        4,
      ) + 10;

    ensureSpace(doc, state, height + 4);
    doc
      .font('resumeSans')
      .fontSize(8.6)
      .fillColor(COLORS.faint)
      .text(String(index + 1).padStart(2, '0'), PAGE_MARGIN_X, state.cursor + 1, {
        width: 14,
      });

    doc
      .save()
      .lineWidth(1.3)
      .strokeColor(COLORS.accent)
      .moveTo(PAGE_MARGIN_X + 18, state.cursor + 1)
      .lineTo(PAGE_MARGIN_X + 18, state.cursor + height - 4)
      .stroke()
      .restore();

    doc
      .font('resumeSans')
      .fontSize(10.7)
      .fillColor(COLORS.body)
      .text(bullet, PAGE_MARGIN_X + 30, state.cursor, {
        width: CONTENT_WIDTH - 30,
        lineGap: 4,
      });

    state.cursor = doc.y + 10;
  });

  state.cursor += 2;
}

function measureSkillRow(
  doc: PDFKit.PDFDocument,
  skills: string[],
  width: number,
): number {
  if (skills.length === 0) {
    return 0;
  }

  const heights = skills.map((skill) =>
    measureText(doc, 'resumeSans', 9.8, skill, width - 12, 2),
  );

  return Math.max(...heights, 12) + 8;
}

function drawSkillItem(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  width: number,
  skill: string,
): void {
  doc
    .save()
    .roundedRect(x, y + 5, 4, 4, 2)
    .fill(COLORS.accent)
    .restore();

  doc
    .font('resumeSans')
    .fontSize(9.8)
    .fillColor(COLORS.body)
    .text(skill, x + 12, y, {
      width: width - 12,
      lineGap: 2,
    });
}

function drawSkillsSection(
  doc: PDFKit.PDFDocument,
  skills: string[],
  state: LayoutState,
): void {
  drawSectionHeading(doc, state, '핵심 기술');

  if (skills.length === 0) {
    doc
      .font('resumeSans')
      .fontSize(10)
      .fillColor(COLORS.muted)
      .text('선택된 기술이 없습니다.', PAGE_MARGIN_X, state.cursor, {
        width: CONTENT_WIDTH,
      });
    state.cursor = doc.y + 14;
    return;
  }

  const columnGap = 18;
  const columnWidth = (CONTENT_WIDTH - columnGap) / 2;

  for (let index = 0; index < skills.length; index += 2) {
    const rowSkills = skills.slice(index, index + 2).map((skill) => clampText(skill, 34));
    const rowHeight = measureSkillRow(doc, rowSkills, columnWidth);

    ensureSpace(doc, state, rowHeight + 2);
    drawSkillItem(doc, PAGE_MARGIN_X, state.cursor, columnWidth, rowSkills[0]);

    if (rowSkills[1]) {
      drawSkillItem(
        doc,
        PAGE_MARGIN_X + columnWidth + columnGap,
        state.cursor,
        columnWidth,
        rowSkills[1],
      );
    }

    state.cursor += rowHeight;
  }

  state.cursor += 6;
}

function buildExperienceModel(experience: Experience): ExperienceModel {
  const relatedProjects = (experience.linkedProjects || [])
    .map((project) => cleanText(project.title))
    .filter(Boolean);
  const theme = getExperienceTypeTheme(experience.type);

  const bullets = normalizeResumeStringArray(
    experience.resumeHighlights?.length
      ? experience.resumeHighlights
      : extractExperienceHighlights([experience.description], 2),
    2,
  );

  return {
    label: getExperienceTypeLabel(experience.type),
    title: cleanText(experience.title) || '경험 정보',
    organization: cleanText(experience.organization),
    period: formatExperiencePeriod(experience.startDate, experience.endDate),
    relatedProjects:
      relatedProjects.length > 0
        ? clampText(
            `관련 프로젝트: ${relatedProjects.slice(0, 3).join(', ')}${
              relatedProjects.length > 3
                ? ` 외 ${relatedProjects.length - 3}개`
                : ''
            }`,
            100,
          )
        : '',
    bullets,
    themeColor: theme.pdfColor,
    themeTint: theme.pdfTint,
  };
}

function measureExperienceBlock(
  doc: PDFKit.PDFDocument,
  model: ExperienceModel,
): number {
  const periodWidth = 116;
  const contentWidth = CONTENT_WIDTH - 18;
  const bodyWidth = contentWidth - periodWidth - 14;
  let height = 20;

  height += measureText(doc, 'resumeSans', 13.3, model.title, contentWidth, 2) + 4;

  if (model.organization || model.period) {
    const organizationHeight = model.organization
      ? measureText(doc, 'resumeSans', 10.1, model.organization, bodyWidth, 2)
      : 0;
    const periodHeight = model.period
      ? measureText(doc, 'resumeSans', 9.4, model.period, periodWidth, 2)
      : 0;
    height += Math.max(organizationHeight, periodHeight, 12) + 6;
  }

  if (model.relatedProjects) {
    height +=
      measureText(
        doc,
        'resumeSans',
        9.1,
        model.relatedProjects,
        contentWidth,
        2,
      ) + 6;
  }

  for (const bullet of model.bullets) {
    height +=
      measureText(doc, 'resumeSans', 10.1, bullet, contentWidth - 13, 3) + 8;
  }

  return height + 12;
}

function drawExperienceBlock(
  doc: PDFKit.PDFDocument,
  state: LayoutState,
  model: ExperienceModel,
): void {
  const periodWidth = 116;
  const contentX = PAGE_MARGIN_X + 18;
  const contentWidth = CONTENT_WIDTH - 18;
  const bodyWidth = contentWidth - periodWidth - 14;
  const blockTop = state.cursor;
  const blockHeight = measureExperienceBlock(doc, model);

  doc
    .save()
    .lineWidth(1.6)
    .strokeColor(model.themeColor)
    .moveTo(PAGE_MARGIN_X + 5, blockTop + 4)
    .lineTo(PAGE_MARGIN_X + 5, blockTop + blockHeight - 10)
    .stroke()
    .restore();

  drawPill(doc, contentX, state.cursor, model.label, model.themeTint, model.themeColor);
  state.cursor += 22;

  doc
    .font('resumeSans')
    .fontSize(13.3)
    .fillColor(COLORS.ink)
    .text(model.title, contentX, state.cursor, {
      width: contentWidth,
      lineGap: 2,
    });

  state.cursor = doc.y + 4;

  if (model.organization) {
    doc
      .font('resumeSans')
      .fontSize(10.1)
      .fillColor(COLORS.body)
      .text(model.organization, contentX, state.cursor, {
        width: bodyWidth,
        lineGap: 2,
      });
  }

  if (model.period) {
    doc
      .font('resumeSans')
      .fontSize(9.4)
      .fillColor(COLORS.muted)
      .text(
        model.period,
        contentX + contentWidth - periodWidth,
        state.cursor,
        {
          width: periodWidth,
          align: 'right',
        },
      );
  }

  state.cursor =
    Math.max(
      doc.y,
      state.cursor +
        Math.max(
          measureText(doc, 'resumeSans', 10.1, model.organization, bodyWidth, 2),
          model.period
            ? measureText(doc, 'resumeSans', 9.4, model.period, periodWidth, 2)
            : 0,
          12,
        ),
    ) + 4;

  if (model.relatedProjects) {
    doc
      .font('resumeSans')
      .fontSize(9.1)
      .fillColor(model.themeColor)
      .text(model.relatedProjects, contentX, state.cursor, {
        width: contentWidth,
        lineGap: 2,
      });
    state.cursor = doc.y + 5;
  }

  for (const bullet of model.bullets) {
    state.cursor =
      drawBulletLine(
        doc,
        contentX,
        state.cursor,
        contentWidth,
        bullet,
        10.1,
        model.themeColor,
      ) + 7;
  }

  drawRule(doc, state.cursor + 1, contentX, contentWidth);
  state.cursor += 12;
}

function drawExperienceSection(
  doc: PDFKit.PDFDocument,
  state: LayoutState,
  title: string,
  experiences: Experience[],
): void {
  if (experiences.length > 0) {
    const firstBlockHeight = measureExperienceBlock(
      doc,
      buildExperienceModel(experiences[0]),
    );

    if (
      state.cursor + 22 + firstBlockHeight > CONTENT_LIMIT_Y &&
      state.cursor > PAGE_MARGIN_TOP + 24
    ) {
      addPage(doc, state);
    }
  }

  drawSectionHeading(doc, state, title);

  if (experiences.length === 0) {
    doc
      .font('resumeSans')
      .fontSize(10)
      .fillColor(COLORS.muted)
      .text('표시할 경험 정보가 없습니다.', PAGE_MARGIN_X, state.cursor, {
        width: CONTENT_WIDTH,
      });
    state.cursor = doc.y + 14;
    return;
  }

  for (let index = 0; index < experiences.length; index += 1) {
    const model = buildExperienceModel(experiences[index]);
    const blockHeight = measureExperienceBlock(doc, model);

    if (state.cursor + blockHeight > CONTENT_LIMIT_Y && state.cursor > PAGE_MARGIN_TOP + 48) {
      addPage(doc, state);
      drawSectionHeading(doc, state, title, true);
    }

    drawExperienceBlock(doc, state, model);
  }

  state.cursor += 4;
}

function buildProjectModel(project: Project): ProjectModel {
  const resumeSummary = cleanText(project.resumeSummary);
  const extractedSummary = normalizeResumeStringArray(
    [
      project.description,
      project.problem,
      project.approach,
      ...(project.impactMetrics || []),
      project.outcomes,
    ],
    1,
  )[0];

  const summary = resumeSummary || extractedSummary || '';

  const explicitHighlights = normalizeResumeStringArray(
    project.resumeHighlights || [],
    2,
  ).filter((highlight) => highlight !== summary);

  const fallbackHighlights = extractExperienceHighlights(
    [
      project.problem,
      project.approach,
      ...(project.impactMetrics || []),
      project.outcomes,
    ],
    3,
  ).filter((highlight) => highlight !== summary);

  const bullets =
    explicitHighlights.length > 0
      ? explicitHighlights.slice(0, 2)
      : normalizeResumeStringArray(fallbackHighlights, 2);

  const meta = unique([
    project.role,
    formatProjectCategory(project.category),
    formatProjectStatus(project.status),
    formatPeriod(project.startDate, project.endDate),
  ]).join('  |  ');

  return {
    title: cleanText(project.resumeTitle || project.title) || '프로젝트',
    summary,
    meta,
    bullets,
    stack: cleanText((project.techStack || []).slice(0, 6).join(', ')),
  };
}

function measureProjectBlock(
  doc: PDFKit.PDFDocument,
  model: ProjectModel,
): number {
  let height = 8;

  height += measureText(doc, 'resumeSans', 12.8, model.title, CONTENT_WIDTH, 2) + 4;

  if (model.meta) {
    height += measureText(doc, 'resumeSans', 9.2, model.meta, CONTENT_WIDTH, 2) + 6;
  }

  if (model.summary) {
    height +=
      measureText(doc, 'resumeSans', 10.1, model.summary, CONTENT_WIDTH, 3) + 6;
  }

  for (const bullet of model.bullets) {
    height +=
      measureText(doc, 'resumeSans', 9.8, bullet, CONTENT_WIDTH - 13, 3) + 7;
  }

  if (model.stack) {
    height +=
      measureText(
        doc,
        'resumeSans',
        9,
        `기술 스택: ${model.stack}`,
        CONTENT_WIDTH,
        2,
      ) + 6;
  }

  return height + 10;
}

function drawProjectBlock(
  doc: PDFKit.PDFDocument,
  state: LayoutState,
  model: ProjectModel,
): void {
  const blockTop = state.cursor;

  doc
    .save()
    .lineWidth(1.1)
    .strokeColor(COLORS.accentLine)
    .moveTo(PAGE_MARGIN_X + 4, blockTop + 2)
    .lineTo(PAGE_MARGIN_X + 4, blockTop + 18)
    .stroke()
    .restore();

  doc
    .font('resumeSans')
    .fontSize(12.8)
    .fillColor(COLORS.ink)
    .text(model.title, PAGE_MARGIN_X + 14, state.cursor, {
      width: CONTENT_WIDTH - 14,
      lineGap: 2,
    });

  state.cursor = doc.y + 4;

  if (model.meta) {
    doc
      .font('resumeSans')
      .fontSize(9.2)
      .fillColor(COLORS.muted)
      .text(model.meta, PAGE_MARGIN_X + 14, state.cursor, {
        width: CONTENT_WIDTH,
        lineGap: 2,
      });
    state.cursor = doc.y + 5;
  }

  if (model.summary) {
    doc
      .font('resumeSans')
      .fontSize(10.1)
      .fillColor(COLORS.body)
      .text(model.summary, PAGE_MARGIN_X + 14, state.cursor, {
        width: CONTENT_WIDTH - 14,
        lineGap: 3,
      });
    state.cursor = doc.y + 5;
  }

  for (const bullet of model.bullets) {
    state.cursor =
      drawBulletLine(
        doc,
        PAGE_MARGIN_X + 14,
        state.cursor,
        CONTENT_WIDTH - 14,
        bullet,
        9.8,
        COLORS.accent,
      ) + 7;
  }

  if (model.stack) {
    doc
      .font('resumeSans')
      .fontSize(9)
      .fillColor(COLORS.muted)
      .text(`기술 스택: ${model.stack}`, PAGE_MARGIN_X + 14, state.cursor, {
        width: CONTENT_WIDTH - 14,
        lineGap: 2,
      });
    state.cursor = doc.y + 6;
  }

  drawRule(doc, state.cursor + 1, PAGE_MARGIN_X + 14, CONTENT_WIDTH - 14);
  state.cursor += 10;
}

function drawProjectSection(
  doc: PDFKit.PDFDocument,
  state: LayoutState,
  projects: Project[],
): void {
  if (projects.length > 0) {
    const firstBlockHeight = measureProjectBlock(
      doc,
      buildProjectModel(projects[0]),
    );

    if (
      state.cursor + 22 + firstBlockHeight > CONTENT_LIMIT_Y &&
      state.cursor > PAGE_MARGIN_TOP + 24
    ) {
      addPage(doc, state);
    }
  }

  drawSectionHeading(doc, state, '주요 프로젝트');

  if (projects.length === 0) {
    doc
      .font('resumeSans')
      .fontSize(10)
      .fillColor(COLORS.muted)
      .text('이력서에 선택된 프로젝트가 없습니다.', PAGE_MARGIN_X, state.cursor, {
        width: CONTENT_WIDTH,
      });
    state.cursor = doc.y + 14;
    return;
  }

  for (const project of projects) {
    const model = buildProjectModel(project);
    const blockHeight = measureProjectBlock(doc, model);

    if (state.cursor + blockHeight > CONTENT_LIMIT_Y && state.cursor > PAGE_MARGIN_TOP + 48) {
      addPage(doc, state);
      drawSectionHeading(doc, state, '주요 프로젝트', true);
    }

    drawProjectBlock(doc, state, model);
  }
}

function drawResumeContent(
  doc: PDFKit.PDFDocument,
  snapshot: ResumeSnapshot,
  photoBuffer: Buffer | null,
): void {
  const state: LayoutState = {
    cursor: PAGE_MARGIN_TOP,
  };

  drawHeader(doc, snapshot, photoBuffer, state);
  drawMetricsRow(doc, snapshot, state);
  drawSummarySection(doc, snapshot, state);

  const careerExperiences = snapshot.selectedExperiences.filter(
    (experience) => experience.type === 'career',
  );
  const additionalExperiences = snapshot.selectedExperiences.filter(
    (experience) => experience.type !== 'career',
  );

  if (careerExperiences.length > 0) {
    drawExperienceSection(doc, state, '실무 경험', careerExperiences);
  }

  if (additionalExperiences.length > 0) {
    drawExperienceSection(doc, state, '기타 경험', additionalExperiences);
  }

  if (careerExperiences.length === 0 && additionalExperiences.length === 0) {
    drawExperienceSection(doc, state, '경험', []);
  }

  drawProjectSection(doc, state, snapshot.selectedProjects);
}

export async function renderResumePdf(
  snapshot: ResumeSnapshot,
): Promise<Buffer> {
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
        Title: `${
          snapshot.settings.name || snapshot.profile.name || 'Portfolio'
        } Resume`,
        Author: snapshot.settings.name || snapshot.profile.name || 'Portfolio',
        Subject: 'Minimal resume PDF',
      },
    });

    const chunks: Buffer[] = [];
    doc.on('data', (chunk) =>
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)),
    );
    doc.on('error', reject);
    doc.on('end', () => resolve(Buffer.concat(chunks)));

    doc.registerFont('resumeSerif', fonts.serif);
    doc.registerFont('resumeSans', fonts.sans);
    doc.font('resumeSans');

    drawResumeContent(doc, snapshot, photoBuffer);
    drawFooter(doc, snapshot);
    doc.end();
  });
}
