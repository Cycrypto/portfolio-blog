import fs from 'node:fs';
import path from 'node:path';

import PDFDocument from 'pdfkit';

import {
  formatExperiencePeriod,
  getExperienceTypeLabel,
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
const PAGE_MARGIN_X = 52;
const PAGE_MARGIN_TOP = 44;
const PAGE_MARGIN_BOTTOM = 40;
const CONTENT_WIDTH = PAGE_WIDTH - PAGE_MARGIN_X * 2;
const CONTENT_LIMIT_Y = PAGE_HEIGHT - PAGE_MARGIN_BOTTOM;

const COLORS = {
  ink: '#0F172A',
  body: '#334155',
  muted: '#64748B',
  faint: '#94A3B8',
  rule: '#E2E8F0',
  accent: '#1D4ED8',
  accentSoft: '#DBEAFE',
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

function drawSectionHeading(
  doc: PDFKit.PDFDocument,
  state: LayoutState,
  title: string,
  continued = false,
): void {
  ensureSpace(doc, state, 34);
  const heading = continued ? `${title} (계속)` : title;

  doc
    .font('resumeSans')
    .fontSize(10.5)
    .fillColor(COLORS.ink)
    .text(heading, PAGE_MARGIN_X, state.cursor, {
      width: 160,
    });

  const titleWidth = doc.widthOfString(heading);
  drawRule(doc, state.cursor + 7, PAGE_MARGIN_X + titleWidth + 14, CONTENT_WIDTH - titleWidth - 14);
  state.cursor += 22;
}

function drawBulletLine(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  width: number,
  text: string,
  fontSize = 10.2,
): number {
  doc
    .save()
    .roundedRect(x, y + 6, 4, 4, 2)
    .fill(COLORS.accent)
    .restore();

  doc
    .font('resumeSans')
    .fontSize(fontSize)
    .fillColor(COLORS.body)
    .text(text, x + 12, y, {
      width: width - 12,
      lineGap: 3,
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
  const photoWidth = hasPhoto ? 78 : 0;
  const photoGap = hasPhoto ? 18 : 0;
  const textWidth = CONTENT_WIDTH - photoWidth - photoGap;
  const textX = PAGE_MARGIN_X;
  const photoX = PAGE_MARGIN_X + textWidth + photoGap;
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
    150,
  );

  const primaryContact = unique([
    snapshot.settings.location,
    snapshot.settings.email,
  ]).join('  |  ');
  const secondaryContact = unique([
    shortenLink(snapshot.settings.github),
    shortenLink(snapshot.settings.linkedin),
  ]).join('  |  ');

  doc
    .font('resumeSerif')
    .fontSize(28)
    .fillColor(COLORS.ink)
    .text(name, textX, topY, {
      width: textWidth,
    });

  let cursor = doc.y + 2;

  doc
    .font('resumeSans')
    .fontSize(13.4)
    .fillColor(COLORS.accent)
    .text(title, textX, cursor, {
      width: textWidth,
    });

  cursor = doc.y + 8;

  if (primaryContact) {
    doc
      .font('resumeSans')
      .fontSize(9.5)
      .fillColor(COLORS.body)
      .text(primaryContact, textX, cursor, {
        width: textWidth,
      });
    cursor = doc.y + 3;
  }

  if (secondaryContact) {
    doc
      .font('resumeSans')
      .fontSize(9.5)
      .fillColor(COLORS.muted)
      .text(secondaryContact, textX, cursor, {
        width: textWidth,
      });
    cursor = doc.y + 8;
  }

  if (headline) {
    doc
      .font('resumeSans')
      .fontSize(10.6)
      .fillColor(COLORS.body)
      .text(headline, textX, cursor, {
        width: textWidth,
        lineGap: 3,
      });
    cursor = doc.y + 4;
  }

  if (hasPhoto && photoBuffer) {
    try {
      doc.image(photoBuffer, photoX, topY + 4, {
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
      .roundedRect(photoX, topY + 4, photoWidth, 96, 10)
      .stroke()
      .restore();
  }

  state.cursor = hasPhoto ? Math.max(cursor, topY + 108) : cursor;
  drawRule(doc, state.cursor + 2);
  state.cursor += 20;
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
      .fontSize(10)
      .fillColor(COLORS.muted)
      .text('요약 정보가 없습니다.', PAGE_MARGIN_X, state.cursor, {
        width: CONTENT_WIDTH,
      });
    state.cursor = doc.y + 14;
    return;
  }

  for (const bullet of snapshot.summaryBullets) {
    const height =
      measureText(
        doc,
        'resumeSans',
        10.2,
        bullet,
        CONTENT_WIDTH - 12,
        3,
      ) + 8;

    ensureSpace(doc, state, height + 4);
    state.cursor = drawBulletLine(
      doc,
      PAGE_MARGIN_X,
      state.cursor,
      CONTENT_WIDTH,
      bullet,
      10.2,
    ) + 8;
  }

  state.cursor += 4;
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
  };
}

function measureExperienceBlock(
  doc: PDFKit.PDFDocument,
  model: ExperienceModel,
): number {
  const periodWidth = 112;
  const bodyWidth = CONTENT_WIDTH - periodWidth - 12;
  let height = 14;

  height += measureText(doc, 'resumeSans', 12, model.title, CONTENT_WIDTH, 2) + 4;

  if (model.organization || model.period) {
    const organizationHeight = model.organization
      ? measureText(doc, 'resumeSans', 9.7, model.organization, bodyWidth, 2)
      : 0;
    const periodHeight = model.period
      ? measureText(doc, 'resumeSans', 9.5, model.period, periodWidth, 2)
      : 0;
    height += Math.max(organizationHeight, periodHeight, 12) + 6;
  }

  if (model.relatedProjects) {
    height +=
      measureText(
        doc,
        'resumeSans',
        9.2,
        model.relatedProjects,
        CONTENT_WIDTH,
        2,
      ) + 6;
  }

  for (const bullet of model.bullets) {
    height +=
      measureText(doc, 'resumeSans', 10, bullet, CONTENT_WIDTH - 12, 3) + 7;
  }

  return height + 10;
}

function drawExperienceBlock(
  doc: PDFKit.PDFDocument,
  state: LayoutState,
  model: ExperienceModel,
): void {
  const periodWidth = 112;
  const bodyWidth = CONTENT_WIDTH - periodWidth - 12;

  doc
    .font('resumeSans')
    .fontSize(8.8)
    .fillColor(COLORS.accent)
    .text(model.label, PAGE_MARGIN_X, state.cursor, {
      width: CONTENT_WIDTH,
    });

  state.cursor = doc.y + 2;

  doc
    .font('resumeSans')
    .fontSize(12)
    .fillColor(COLORS.ink)
    .text(model.title, PAGE_MARGIN_X, state.cursor, {
      width: CONTENT_WIDTH,
      lineGap: 2,
    });

  state.cursor = doc.y + 3;

  if (model.organization) {
    doc
      .font('resumeSans')
      .fontSize(9.7)
      .fillColor(COLORS.body)
      .text(model.organization, PAGE_MARGIN_X, state.cursor, {
        width: bodyWidth,
        lineGap: 2,
      });
  }

  if (model.period) {
    doc
      .font('resumeSans')
      .fontSize(9.5)
      .fillColor(COLORS.muted)
      .text(
        model.period,
        PAGE_MARGIN_X + CONTENT_WIDTH - periodWidth,
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
          measureText(doc, 'resumeSans', 9.7, model.organization, bodyWidth, 2),
          model.period
            ? measureText(doc, 'resumeSans', 9.5, model.period, periodWidth, 2)
            : 0,
          12,
        ),
    ) + 4;

  if (model.relatedProjects) {
    doc
      .font('resumeSans')
      .fontSize(9.2)
      .fillColor(COLORS.muted)
      .text(model.relatedProjects, PAGE_MARGIN_X, state.cursor, {
        width: CONTENT_WIDTH,
        lineGap: 2,
      });
    state.cursor = doc.y + 5;
  }

  for (const bullet of model.bullets) {
    state.cursor =
      drawBulletLine(
        doc,
        PAGE_MARGIN_X,
        state.cursor,
        CONTENT_WIDTH,
        bullet,
        10,
      ) + 7;
  }

  drawRule(doc, state.cursor);
  state.cursor += 10;
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
  let height = 0;

  height += measureText(doc, 'resumeSans', 12, model.title, CONTENT_WIDTH, 2) + 4;

  if (model.meta) {
    height += measureText(doc, 'resumeSans', 9.4, model.meta, CONTENT_WIDTH, 2) + 6;
  }

  if (model.summary) {
    height +=
      measureText(doc, 'resumeSans', 10, model.summary, CONTENT_WIDTH, 3) + 6;
  }

  for (const bullet of model.bullets) {
    height +=
      measureText(doc, 'resumeSans', 9.8, bullet, CONTENT_WIDTH - 12, 3) + 7;
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
  doc
    .font('resumeSans')
    .fontSize(12)
    .fillColor(COLORS.ink)
    .text(model.title, PAGE_MARGIN_X, state.cursor, {
      width: CONTENT_WIDTH,
      lineGap: 2,
    });

  state.cursor = doc.y + 4;

  if (model.meta) {
    doc
      .font('resumeSans')
      .fontSize(9.4)
      .fillColor(COLORS.muted)
      .text(model.meta, PAGE_MARGIN_X, state.cursor, {
        width: CONTENT_WIDTH,
        lineGap: 2,
      });
    state.cursor = doc.y + 5;
  }

  if (model.summary) {
    doc
      .font('resumeSans')
      .fontSize(10)
      .fillColor(COLORS.body)
      .text(model.summary, PAGE_MARGIN_X, state.cursor, {
        width: CONTENT_WIDTH,
        lineGap: 3,
      });
    state.cursor = doc.y + 5;
  }

  for (const bullet of model.bullets) {
    state.cursor =
      drawBulletLine(
        doc,
        PAGE_MARGIN_X,
        state.cursor,
        CONTENT_WIDTH,
        bullet,
        9.8,
      ) + 7;
  }

  if (model.stack) {
    doc
      .font('resumeSans')
      .fontSize(9)
      .fillColor(COLORS.muted)
      .text(`기술 스택: ${model.stack}`, PAGE_MARGIN_X, state.cursor, {
        width: CONTENT_WIDTH,
        lineGap: 2,
      });
    state.cursor = doc.y + 6;
  }

  drawRule(doc, state.cursor);
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
  drawSummarySection(doc, snapshot, state);
  drawSkillsSection(doc, snapshot.featuredSkills, state);

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
