import fs from 'node:fs';
import path from 'node:path';

import PDFDocument from 'pdfkit';

import {
  formatExperiencePeriod,
  getExperienceTypeLabel,
} from '@/lib/experience/utils';
import { absoluteUrl } from '@/lib/site';
import type { Experience, Project } from '@/lib/types/api';
import { normalizeImageUrl } from '@/lib/utils/image';
import { extractExperienceHighlights } from './resume-content';
import type { AdminPortfolioSnapshot } from './build-admin-portfolio-snapshot';

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const PAGE_MARGIN_X = 40;
const PAGE_MARGIN_TOP = 34;
const PAGE_MARGIN_BOTTOM = 32;
const CONTENT_WIDTH = PAGE_WIDTH - PAGE_MARGIN_X * 2;
const CONTENT_LIMIT_Y = PAGE_HEIGHT - PAGE_MARGIN_BOTTOM;
const MAX_SECONDARY_PROJECTS = 6;

const COLORS = {
  ink: '#132238',
  body: '#334155',
  muted: '#64748B',
  faint: '#94A3B8',
  rule: '#D9E2EA',
  accent: '#36576F',
  accentSoft: '#ECF4F7',
  accentStrong: '#243B53',
  highlight: '#F8FAFC',
  success: '#0F766E',
};

interface LayoutState {
  cursor: number;
}

function resolveFontPath(candidates: string[], message: string): string {
  const resolved = candidates.find((candidate) => fs.existsSync(candidate));

  if (!resolved) {
    throw new Error(message);
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
    'A Korean serif font is required to generate the portfolio PDF.',
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

  return {
    serif,
    sans: sansCandidates.find((candidate) => fs.existsSync(candidate)) || serif,
  };
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

function formatProjectPeriod(project: Project): string {
  const start = cleanText(project.startDate).replace(/^(\d{4})-(\d{2}).*$/, '$1.$2');
  const end = cleanText(project.endDate).replace(/^(\d{4})-(\d{2}).*$/, '$1.$2');

  if (!start && !end) {
    return '기간 정리 중';
  }

  if (!start) {
    return end;
  }

  return `${start} - ${end || '현재'}`;
}

function formatExperienceSummary(experience: Experience): string[] {
  const highlights = extractExperienceHighlights(
    [...(experience.resumeHighlights || []), experience.description || ''],
    2,
  );

  if (highlights.length > 0) {
    return highlights;
  }

  return [];
}

function resolveProjectHeadline(project: Project): string {
  return cleanText(project.resumeTitle || project.title || '프로젝트');
}

function resolveProjectSummary(project: Project): string {
  const summary = cleanText(project.resumeSummary);
  if (summary) {
    return summary;
  }

  const fallback = [
    cleanText(project.description),
    ...(project.impactMetrics || []).map((item) => cleanText(item)),
    cleanText(project.longDescription),
  ].find(Boolean);

  return clampText(fallback || '프로젝트 설명을 정리 중입니다.', 180);
}

function resolveProjectHighlights(project: Project): string[] {
  const explicit = (project.resumeHighlights || [])
    .map((item) => cleanText(item))
    .filter(Boolean)
    .slice(0, 3);

  if (explicit.length > 0) {
    return explicit;
  }

  const fallbacks = [
    ...(project.features || []),
    ...(project.impactMetrics || []),
  ]
    .map((item) => cleanText(item))
    .filter(Boolean)
    .slice(0, 3);

  if (fallbacks.length > 0) {
    return fallbacks;
  }

  const stack = (project.techStack || []).slice(0, 4).join(' · ');
  return stack ? [`기술 스택: ${stack}`] : [];
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
  const resolved = resolvePhotoUrl(photoUrl);

  if (!resolved) {
    return null;
  }

  try {
    if (/^https?:\/\//i.test(resolved)) {
      const response = await fetch(resolved);
      if (!response.ok) {
        return null;
      }

      return Buffer.from(await response.arrayBuffer());
    }

    return fs.readFileSync(resolved);
  } catch (error) {
    console.error('Failed to load portfolio photo:', error);
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
  fillColor = COLORS.accentSoft,
  textColor = COLORS.accentStrong,
): number {
  doc.font('portfolioSans').fontSize(8.4);
  const textWidth = doc.widthOfString(label, { characterSpacing: 0.8 });
  const width = textWidth + 18;

  doc.save().roundedRect(x, y, width, 18, 9).fill(fillColor).restore();
  doc
    .font('portfolioSans')
    .fontSize(8.4)
    .fillColor(textColor)
    .text(label, x + 9, y + 4.7, {
      width: textWidth + 2,
      characterSpacing: 0.8,
    });

  return width;
}

function drawSectionHeading(
  doc: PDFKit.PDFDocument,
  state: LayoutState,
  title: string,
): void {
  ensureSpace(doc, state, 28);

  doc
    .font('portfolioSerif')
    .fontSize(16)
    .fillColor(COLORS.ink)
    .text(title, PAGE_MARGIN_X, state.cursor, {
      width: 200,
    });

  const width = doc.widthOfString(title);
  drawRule(
    doc,
    state.cursor + 12,
    PAGE_MARGIN_X + width + 16,
    Math.max(0, CONTENT_WIDTH - width - 16),
  );

  state.cursor += 24;
}

function drawColumnHeading(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  width: number,
  title: string,
): number {
  doc
    .font('portfolioSerif')
    .fontSize(14.4)
    .fillColor(COLORS.ink)
    .text(title, x, y, {
      width,
    });

  const headingWidth = doc.widthOfString(title);
  drawRule(
    doc,
    y + 12,
    x + headingWidth + 12,
    Math.max(0, width - headingWidth - 12),
  );

  return y + 24;
}

function drawLinkLine(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  label: string,
  value: string,
  link?: string,
): number {
  doc
    .font('portfolioSans')
    .fontSize(7.8)
    .fillColor(COLORS.faint)
    .text(label, x, y, {
      width: 150,
      characterSpacing: 1.1,
    });

  const contentY = doc.y + 2;

  doc
    .font('portfolioSans')
    .fontSize(9.4)
    .fillColor(link ? COLORS.accent : COLORS.body)
    .text(value, x, contentY, {
      width: 150,
      lineGap: 2,
      link,
      underline: Boolean(link),
    });

  return doc.y;
}

function drawMetricCard(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  width: number,
  label: string,
  value: string,
  description: string,
): number {
  doc
    .save()
    .roundedRect(x, y, width, 70, 14)
    .fillAndStroke(COLORS.highlight, COLORS.rule)
    .restore();

  doc
    .font('portfolioSans')
    .fontSize(8.6)
    .fillColor(COLORS.faint)
    .text(label, x + 14, y + 12, { width: width - 28, characterSpacing: 0.8 });

  doc
    .font('portfolioSerif')
    .fontSize(20)
    .fillColor(COLORS.ink)
    .text(value, x + 14, y + 27, {
      width: width - 28,
    });

  doc
    .font('portfolioSans')
    .fontSize(9.2)
    .fillColor(COLORS.body)
    .text(description, x + 14, y + 50, {
      width: width - 28,
    });

  return 70;
}

function drawBullet(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  width: number,
  text: string,
  bulletColor = COLORS.accent,
): number {
  doc.save().circle(x + 3, y + 9, 2.1).fill(bulletColor).restore();
  doc
    .font('portfolioSans')
    .fontSize(10)
    .fillColor(COLORS.body)
    .text(text, x + 12, y, {
      width: width - 12,
      lineGap: 3,
    });

  return doc.y;
}

function drawHeader(
  doc: PDFKit.PDFDocument,
  snapshot: AdminPortfolioSnapshot,
  photoBuffer: Buffer | null,
  state: LayoutState,
): void {
  const hasPhoto = Boolean(snapshot.settings.showPhoto && photoBuffer);
  const railWidth = hasPhoto ? 170 : 155;
  const photoWidth = hasPhoto ? 78 : 0;
  const columnGap = 24;
  const textWidth = CONTENT_WIDTH - railWidth - columnGap;
  const textX = PAGE_MARGIN_X;
  const railX = PAGE_MARGIN_X + textWidth + columnGap;
  const topY = state.cursor;
  const contactLinks = [
    snapshot.settings.location
      ? { label: 'LOCATION', value: snapshot.settings.location }
      : null,
    snapshot.settings.email
      ? {
          label: 'EMAIL',
          value: snapshot.settings.email,
          link: `mailto:${snapshot.settings.email}`,
        }
      : null,
    snapshot.settings.github
      ? {
          label: 'GITHUB',
          value: cleanText(snapshot.settings.github).replace(/^https?:\/\//, ''),
          link: snapshot.settings.github,
        }
      : null,
    snapshot.settings.linkedin
      ? {
          label: 'LINKEDIN',
          value: cleanText(snapshot.settings.linkedin).replace(/^https?:\/\//, ''),
          link: snapshot.settings.linkedin,
        }
      : null,
  ].filter(
    (
      item,
    ): item is {
      label: string;
      value: string;
      link?: string;
    } => Boolean(item),
  );

  drawPill(doc, textX, topY, 'ADMIN PORTFOLIO PDF');

  let textCursor = topY + 28;

  doc
    .font('portfolioSerif')
    .fontSize(30)
    .fillColor(COLORS.ink)
    .text('박준하 포트폴리오', textX, textCursor, {
      width: textWidth,
    });

  textCursor = doc.y + 4;

  doc
    .font('portfolioSans')
    .fontSize(15)
    .fillColor(COLORS.accentStrong)
    .text(snapshot.settings.title || snapshot.profile.title || 'Junior Product Engineer', textX, textCursor, {
      width: textWidth,
    });

  textCursor = doc.y + 10;

  const positioning = cleanText(
    snapshot.settings.headline ||
      snapshot.profile.subtitle ||
      snapshot.profile.about ||
      snapshot.profile.description,
  );

  if (positioning) {
    doc
      .font('portfolioSans')
      .fontSize(11.2)
      .fillColor(COLORS.body)
      .text(clampText(positioning, 170), textX, textCursor, {
        width: textWidth,
        lineGap: 4,
      });
    textCursor = doc.y + 8;
  }

  for (const bullet of snapshot.summaryBullets.slice(0, 2)) {
    textCursor = drawBullet(doc, textX, textCursor, textWidth, bullet, COLORS.success) + 6;
  }

  let railCursor = topY;

  if (hasPhoto && photoBuffer) {
    try {
      doc.image(photoBuffer, railX, railCursor, {
        fit: [photoWidth, 92],
        align: 'center',
        valign: 'center',
      });
    } catch (error) {
      console.error('Failed to render portfolio photo:', error);
    }

    doc
      .save()
      .lineWidth(0.8)
      .strokeColor(COLORS.rule)
      .roundedRect(railX, railCursor, photoWidth, 92, 12)
      .stroke()
      .restore();

    railCursor += 104;
  }

  for (const item of contactLinks) {
    railCursor = drawLinkLine(
      doc,
      railX,
      railCursor,
      item.label,
      item.value,
      item.link,
    ) + 8;
  }

  const skillsLabelY = Math.max(railCursor + 2, topY + 150);
  doc
    .font('portfolioSans')
    .fontSize(7.8)
    .fillColor(COLORS.faint)
    .text('CORE STRENGTHS', railX, skillsLabelY, {
      width: railWidth,
      characterSpacing: 1.2,
    });

  let skillY = doc.y + 8;
  let skillX = railX;

  for (const skill of snapshot.featuredSkills.slice(0, 5)) {
    const width = drawPill(
      doc,
      skillX,
      skillY,
      clampText(skill, 20),
      COLORS.highlight,
      COLORS.accentStrong,
    );
    skillX += width + 8;

    if (skillX > railX + railWidth - 60) {
      skillX = railX;
      skillY += 24;
    }
  }

  const headerBottom = Math.max(textCursor, skillY + 26);

  doc
    .save()
    .lineWidth(1)
    .strokeColor(COLORS.rule)
    .moveTo(railX - 14, topY + 4)
    .lineTo(railX - 14, headerBottom)
    .stroke()
    .restore();

  state.cursor = headerBottom + 20;
}

function drawMetrics(
  doc: PDFKit.PDFDocument,
  snapshot: AdminPortfolioSnapshot,
  state: LayoutState,
): void {
  const gap = 12;
  const cardWidth = (CONTENT_WIDTH - gap) / 2;
  const topY = state.cursor;

  drawMetricCard(
    doc,
    PAGE_MARGIN_X,
    topY,
    cardWidth,
    snapshot.metrics[0].label,
    snapshot.metrics[0].value,
    snapshot.metrics[0].description,
  );
  drawMetricCard(
    doc,
    PAGE_MARGIN_X + cardWidth + gap,
    topY,
    cardWidth,
    snapshot.metrics[1].label,
    snapshot.metrics[1].value,
    snapshot.metrics[1].description,
  );
  drawMetricCard(
    doc,
    PAGE_MARGIN_X,
    topY + 82,
    cardWidth,
    snapshot.metrics[2].label,
    snapshot.metrics[2].value,
    snapshot.metrics[2].description,
  );
  drawMetricCard(
    doc,
    PAGE_MARGIN_X + cardWidth + gap,
    topY + 82,
    cardWidth,
    snapshot.metrics[3].label,
    snapshot.metrics[3].value,
    snapshot.metrics[3].description,
  );

  state.cursor = topY + 164;
}

function drawFeaturedTeasers(
  doc: PDFKit.PDFDocument,
  snapshot: AdminPortfolioSnapshot,
  state: LayoutState,
): void {
  drawSectionHeading(doc, state, '대표 프로젝트 미리보기');

  for (const project of snapshot.featuredProjects) {
    ensureSpace(doc, state, 84);
    const period = formatProjectPeriod(project);
    const title = resolveProjectHeadline(project);
    const summary = resolveProjectSummary(project);
    const stack = (project.techStack || []).slice(0, 5).join(' · ');

    doc
      .save()
      .roundedRect(PAGE_MARGIN_X, state.cursor, CONTENT_WIDTH, 72, 14)
      .fillAndStroke('#FFFFFF', COLORS.rule)
      .restore();

    doc
      .font('portfolioSans')
      .fontSize(8.2)
      .fillColor(COLORS.faint)
      .text(`${period} · ${cleanText(project.category || 'project')} · ${cleanText(project.status || '진행')}`, PAGE_MARGIN_X + 14, state.cursor + 11, {
        width: CONTENT_WIDTH - 28,
        characterSpacing: 0.4,
      });

    doc
      .font('portfolioSerif')
      .fontSize(15)
      .fillColor(COLORS.ink)
      .text(title, PAGE_MARGIN_X + 14, state.cursor + 25, {
        width: CONTENT_WIDTH - 28,
      });

    doc
      .font('portfolioSans')
      .fontSize(9.7)
      .fillColor(COLORS.body)
      .text(clampText(summary, 110), PAGE_MARGIN_X + 14, state.cursor + 44, {
        width: CONTENT_WIDTH - 28,
        lineGap: 2,
      });

    if (stack) {
      doc
        .font('portfolioSans')
        .fontSize(8.6)
        .fillColor(COLORS.muted)
        .text(clampText(`Stack · ${stack}`, 95), PAGE_MARGIN_X + 14, state.cursor + 58, {
          width: CONTENT_WIDTH - 28,
        });
    }

    state.cursor += 84;
  }
}

function drawExperienceTimelineColumn(
  doc: PDFKit.PDFDocument,
  snapshot: AdminPortfolioSnapshot,
  x: number,
  y: number,
  width: number,
): number {
  let cursor = drawColumnHeading(doc, x, y, width, '경력과 활동');

  for (const experience of snapshot.selectedExperiences) {
    const period = formatExperiencePeriod(
      experience.startDate,
      experience.endDate,
    );
    const tagWidth = drawPill(
      doc,
      x,
      cursor + 2,
      getExperienceTypeLabel(experience.type),
    );

    doc
      .font('portfolioSans')
      .fontSize(8.4)
      .fillColor(COLORS.faint)
      .text(period, x + tagWidth + 10, cursor + 6, {
        width: width - tagWidth - 10,
      });

    doc
      .font('portfolioSerif')
      .fontSize(12.6)
      .fillColor(COLORS.ink)
      .text(experience.title, x, cursor + 24, {
        width,
      });

    doc
      .font('portfolioSans')
      .fontSize(9.4)
      .fillColor(COLORS.accentStrong)
      .text(experience.organization, x, cursor + 40, {
        width,
      });

    let detailY = cursor + 54;
    for (const bullet of formatExperienceSummary(experience).slice(0, 1)) {
      detailY = drawBullet(doc, x, detailY, width, bullet) + 3;
    }

    cursor = Math.max(detailY, cursor + 72);
    drawRule(doc, cursor - 4, x, width);
    cursor += 8;
  }

  return cursor;
}

function drawProjectLinks(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  project: Project,
): number {
  const links = [
    project.liveUrl
      ? { label: '서비스 보기', url: project.liveUrl }
      : null,
    project.githubUrl
      ? { label: '코드 보기', url: project.githubUrl }
      : null,
  ].filter(
    (item): item is { label: string; url: string } => Boolean(item),
  );

  let currentX = x;

  for (const link of links) {
    doc
      .font('portfolioSans')
      .fontSize(9)
      .fillColor(COLORS.accent)
      .text(link.label, currentX, y, {
        link: link.url,
        underline: true,
      });

    currentX = doc.x + 18;
  }

  return links.length > 0 ? y + 16 : y;
}

function drawCaseStudiesColumn(
  doc: PDFKit.PDFDocument,
  snapshot: AdminPortfolioSnapshot,
  x: number,
  y: number,
  width: number,
): number {
  let cursor = drawColumnHeading(doc, x, y, width, '대표 프로젝트 상세');

  for (const project of snapshot.featuredProjects) {
    const cardY = cursor;
    doc
      .save()
      .roundedRect(x, cardY, width, 126, 16)
      .fillAndStroke('#FFFFFF', COLORS.rule)
      .restore();

    doc
      .font('portfolioSans')
      .fontSize(8.5)
      .fillColor(COLORS.faint)
      .text(
        `${formatProjectPeriod(project)} · ${cleanText(project.status || '진행중')}`,
        x + 14,
        cardY + 14,
        { width: width - 28 },
      );

    doc
      .font('portfolioSerif')
      .fontSize(13.4)
      .fillColor(COLORS.ink)
      .text(resolveProjectHeadline(project), x + 14, cardY + 28, {
        width: width - 28,
      });

    doc
      .font('portfolioSans')
      .fontSize(9.5)
      .fillColor(COLORS.body)
      .text(clampText(resolveProjectSummary(project), 120), x + 14, cardY + 46, {
        width: width - 28,
        lineGap: 2,
      });

    let bulletY = Math.max(doc.y + 6, cardY + 76);
    for (const bullet of resolveProjectHighlights(project).slice(0, 2)) {
      bulletY = drawBullet(doc, x + 14, bulletY, width - 28, bullet) + 3;
    }

    const stack = cleanText((project.techStack || []).slice(0, 4).join(' · '));
    if (stack) {
      doc
        .font('portfolioSans')
        .fontSize(8.4)
        .fillColor(COLORS.muted)
        .text(clampText(`Stack · ${stack}`, 58), x + 14, cardY + 104, {
          width: width - 130,
        });
    }

    drawProjectLinks(doc, x + width - 108, cardY + 104, project);
    cursor = cardY + 138;
  }

  return cursor;
}

function drawPageTwoColumns(
  doc: PDFKit.PDFDocument,
  snapshot: AdminPortfolioSnapshot,
  state: LayoutState,
): void {
  const columnGap = 20;
  const columnWidth = (CONTENT_WIDTH - columnGap) / 2;
  const leftX = PAGE_MARGIN_X;
  const rightX = PAGE_MARGIN_X + columnWidth + columnGap;
  const topY = state.cursor;

  const leftBottom = drawExperienceTimelineColumn(
    doc,
    snapshot,
    leftX,
    topY,
    columnWidth,
  );
  const rightBottom = drawCaseStudiesColumn(
    doc,
    snapshot,
    rightX,
    topY,
    columnWidth,
  );

  state.cursor = Math.max(leftBottom, rightBottom);
}

function drawSecondaryProjects(
  doc: PDFKit.PDFDocument,
  snapshot: AdminPortfolioSnapshot,
  state: LayoutState,
): void {
  if (snapshot.secondaryProjects.length === 0) {
    return;
  }

  addPage(doc, state);
  drawSectionHeading(doc, state, '기타 프로젝트');

  for (const project of snapshot.secondaryProjects.slice(0, MAX_SECONDARY_PROJECTS)) {
    ensureSpace(doc, state, 56);

    doc
      .font('portfolioSerif')
      .fontSize(13.4)
      .fillColor(COLORS.ink)
      .text(resolveProjectHeadline(project), PAGE_MARGIN_X, state.cursor, {
        width: CONTENT_WIDTH,
      });

    doc
      .font('portfolioSans')
      .fontSize(8.8)
      .fillColor(COLORS.faint)
      .text(
        `${formatProjectPeriod(project)} · ${cleanText(project.category || 'project')} · ${cleanText(project.status || '진행중')}`,
        PAGE_MARGIN_X,
        state.cursor + 18,
        { width: CONTENT_WIDTH },
      );

    doc
      .font('portfolioSans')
      .fontSize(9.7)
      .fillColor(COLORS.body)
      .text(clampText(resolveProjectSummary(project), 120), PAGE_MARGIN_X, state.cursor + 32, {
        width: CONTENT_WIDTH,
        lineGap: 2,
      });

    state.cursor = doc.y + 12;
    drawRule(doc, state.cursor - 4);
  }
}

function drawFooter(
  doc: PDFKit.PDFDocument,
  snapshot: AdminPortfolioSnapshot,
): void {
  const range = doc.bufferedPageRange();
  const label = `${snapshot.settings.name || snapshot.profile.name || '박준하'} Portfolio`;

  for (let index = 0; index < range.count; index += 1) {
    doc.switchToPage(index);
    doc
      .font('portfolioSans')
      .fontSize(8.2)
      .fillColor(COLORS.faint)
      .text(label, PAGE_MARGIN_X, PAGE_HEIGHT - PAGE_MARGIN_BOTTOM + 10, {
        width: CONTENT_WIDTH / 2,
      });

    doc
      .font('portfolioSans')
      .fontSize(8.2)
      .fillColor(COLORS.faint)
      .text(`${index + 1} / ${range.count}`, PAGE_MARGIN_X, PAGE_HEIGHT - PAGE_MARGIN_BOTTOM + 10, {
        width: CONTENT_WIDTH / 2,
        align: 'right',
      });
  }
}

function drawPortfolioContent(
  doc: PDFKit.PDFDocument,
  snapshot: AdminPortfolioSnapshot,
  photoBuffer: Buffer | null,
): void {
  const state: LayoutState = {
    cursor: PAGE_MARGIN_TOP,
  };

  drawHeader(doc, snapshot, photoBuffer, state);
  drawMetrics(doc, snapshot, state);
  drawFeaturedTeasers(doc, snapshot, state);

  addPage(doc, state);
  drawPageTwoColumns(doc, snapshot, state);
  drawSecondaryProjects(doc, snapshot, state);
}

export async function renderAdminPortfolioPdf(
  snapshot: AdminPortfolioSnapshot,
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
        Title: '박준하 포트폴리오',
        Author: snapshot.settings.name || snapshot.profile.name || '박준하',
        Subject: 'Admin-only portfolio PDF',
      },
    });

    const chunks: Buffer[] = [];
    doc.on('data', (chunk) =>
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)),
    );
    doc.on('error', reject);
    doc.on('end', () => resolve(Buffer.concat(chunks)));

    doc.registerFont('portfolioSerif', fonts.serif);
    doc.registerFont('portfolioSans', fonts.sans);
    doc.font('portfolioSans');

    drawPortfolioContent(doc, snapshot, photoBuffer);
    drawFooter(doc, snapshot);
    doc.end();
  });
}
