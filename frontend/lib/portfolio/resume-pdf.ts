import fs from 'node:fs';
import path from 'node:path';

import PDFDocument from 'pdfkit';

import type { Experience, Post, Project } from '@/lib/types/api';

import type { PortfolioSnapshot } from './build-portfolio-snapshot';

const PAGE_SIZE: PDFKit.PDFDocumentOptions['size'] = 'A4';
const PAGE_MARGIN_X = 52;
const PAGE_MARGIN_TOP = 46;
const PAGE_MARGIN_BOTTOM = 42;
const CONTENT_WIDTH = 595.28 - PAGE_MARGIN_X * 2;
const PAGE_HEIGHT = 841.89;
const FOOTER_Y = PAGE_HEIGHT - PAGE_MARGIN_BOTTOM + 8;
const SECTION_GAP = 24;
const ENTRY_GAP = 16;
const COLORS = {
  text: '#111827',
  muted: '#4B5563',
  subtle: '#6B7280',
  rule: '#CBD5E1',
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

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
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

    const source = segments.length > 0 ? segments : [clampText(normalized, charLimit)];

    for (const item of source) {
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

function normalizeLinkLabel(url?: string): string {
  const value = cleanText(url);
  if (!value) {
    return '';
  }

  return value
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/$/, '');
}

function drawFooter(doc: PDFKit.PDFDocument, pageNumber: number, totalPages: number) {
  doc
    .save()
    .fontSize(9)
    .fillColor(COLORS.subtle)
    .text(`${pageNumber} / ${totalPages}`, PAGE_MARGIN_X, FOOTER_Y, {
      width: CONTENT_WIDTH,
      align: 'right',
    })
    .restore();
}

function drawSectionHeading(doc: PDFKit.PDFDocument, title: string, y: number): number {
  doc
    .fontSize(11)
    .fillColor(COLORS.text)
    .text(title, PAGE_MARGIN_X, y, { width: 120 });

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
    doc
      .fontSize(fontSize)
      .fillColor(COLORS.text)
      .text(`- ${item}`, PAGE_MARGIN_X, cursor, {
        width,
        lineGap: 2,
      });

    cursor = doc.y + 4;
  }

  return cursor;
}

function drawHeader(doc: PDFKit.PDFDocument, snapshot: PortfolioSnapshot): number {
  const { profile, yearsOfExperience, availableForWork, featuredProjects, featuredPosts } =
    snapshot;

  const contactItems = unique([
    cleanText(profile.location),
    cleanText(profile.email),
    normalizeLinkLabel(profile.github),
    normalizeLinkLabel(profile.linkedin),
  ]);

  doc.fontSize(27).fillColor(COLORS.text).text(profile.name || '이름 미기재', PAGE_MARGIN_X, PAGE_MARGIN_TOP);

  let cursor = doc.y + 2;

  doc.fontSize(12.5).fillColor(COLORS.muted).text(profile.title || 'Backend Engineer', PAGE_MARGIN_X, cursor, {
    width: CONTENT_WIDTH,
  });

  cursor = doc.y + 4;

  if (contactItems.length > 0) {
    doc
      .fontSize(9.5)
      .fillColor(COLORS.subtle)
      .text(contactItems.join('  |  '), PAGE_MARGIN_X, cursor, {
        width: CONTENT_WIDTH,
      });

    cursor = doc.y + 4;
  }

  const metaLine = unique([
    yearsOfExperience > 0 ? `${yearsOfExperience}+년 경력` : '',
    availableForWork ? '협업 가능 상태' : cleanText(profile.status),
    featuredProjects.length > 0 ? `대표 프로젝트 ${featuredProjects.length}건` : '',
    featuredPosts.length > 0 ? `기술 글 ${featuredPosts.length}건` : '',
  ]).join('  |  ');

  if (metaLine) {
    doc.fontSize(9.5).fillColor(COLORS.subtle).text(metaLine, PAGE_MARGIN_X, cursor, {
      width: CONTENT_WIDTH,
    });

    cursor = doc.y + 8;
  }

  const intro = clampText(
    cleanText(profile.subtitle || profile.description || profile.about || ''),
    210,
  );

  if (intro) {
    doc.fontSize(10.5).fillColor(COLORS.text).text(intro, PAGE_MARGIN_X, cursor, {
      width: CONTENT_WIDTH,
      lineGap: 3,
    });

    cursor = doc.y + 10;
  }

  doc
    .save()
    .lineWidth(1.2)
    .strokeColor(COLORS.rule)
    .moveTo(PAGE_MARGIN_X, cursor)
    .lineTo(PAGE_MARGIN_X + CONTENT_WIDTH, cursor)
    .stroke()
    .restore();

  return cursor + 16;
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
    return doc.y + SECTION_GAP;
  }

  const columnWidth = (CONTENT_WIDTH - 24) / 2;
  const leftSkills = orderedSkills.filter((_, index) => index % 2 === 0);
  const rightSkills = orderedSkills.filter((_, index) => index % 2 === 1);

  const leftText = leftSkills.map((skill) => `- ${skill}`).join('\n');
  const rightText = rightSkills.map((skill) => `- ${skill}`).join('\n');

  doc.fontSize(10).fillColor(COLORS.text);
  doc.text(leftText, PAGE_MARGIN_X, nextY, {
    width: columnWidth,
    lineGap: 3,
  });

  const leftBottom = doc.y;

  doc.text(rightText, PAGE_MARGIN_X + columnWidth + 24, nextY, {
    width: columnWidth,
    lineGap: 3,
  });

  return Math.max(leftBottom, doc.y) + SECTION_GAP;
}

function drawExperienceEntry(
  doc: PDFKit.PDFDocument,
  experience: Experience,
  y: number,
): number {
  const title = unique([cleanText(experience.company), cleanText(experience.title)]).join(' | ');
  const period = formatPeriod(experience.startDate, experience.endDate);
  const titleWidth = CONTENT_WIDTH - 124;

  doc.fontSize(11).fillColor(COLORS.text).text(title || '경력 정보', PAGE_MARGIN_X, y, {
    width: titleWidth,
  });

  if (period) {
    doc.fontSize(9.5).fillColor(COLORS.subtle).text(period, PAGE_MARGIN_X + titleWidth + 16, y + 1, {
      width: 108,
      align: 'right',
    });
  }

  let cursor = Math.max(doc.y, y + 16) + 4;
  const bullets = toBulletItems([experience.description], 2, 108);

  if (bullets.length > 0) {
    cursor = drawBulletList(doc, bullets, cursor, CONTENT_WIDTH, 10);
  }

  doc
    .save()
    .lineWidth(0.6)
    .strokeColor(COLORS.rule)
    .moveTo(PAGE_MARGIN_X, cursor + 4)
    .lineTo(PAGE_MARGIN_X + CONTENT_WIDTH, cursor + 4)
    .stroke()
    .restore();

  return cursor + ENTRY_GAP;
}

function drawExperienceSection(
  doc: PDFKit.PDFDocument,
  experiences: Experience[],
  y: number,
): number {
  let cursor = drawSectionHeading(doc, '경력', y);
  const ordered = [...experiences]
    .sort(
      (a, b) =>
        new Date(b.startDate || 0).getTime() - new Date(a.startDate || 0).getTime(),
    )
    .slice(0, 4);

  if (ordered.length === 0) {
    doc.fontSize(10).fillColor(COLORS.muted).text('등록된 경력 정보가 없습니다.', PAGE_MARGIN_X, cursor, {
      width: CONTENT_WIDTH,
    });
    return doc.y + SECTION_GAP;
  }

  for (const experience of ordered) {
    cursor = drawExperienceEntry(doc, experience, cursor);
  }

  return cursor + 4;
}

function drawProjectEntry(
  doc: PDFKit.PDFDocument,
  project: Project,
  y: number,
): number {
  const period = formatPeriod(project.startDate, project.endDate);
  const titleWidth = CONTENT_WIDTH - 124;

  doc.fontSize(11).fillColor(COLORS.text).text(cleanText(project.title) || '프로젝트', PAGE_MARGIN_X, y, {
    width: titleWidth,
  });

  if (period) {
    doc.fontSize(9.5).fillColor(COLORS.subtle).text(period, PAGE_MARGIN_X + titleWidth + 16, y + 1, {
      width: 108,
      align: 'right',
    });
  }

  let cursor = Math.max(doc.y, y + 16) + 2;

  const subline = unique([
    cleanText(project.category),
    cleanText(project.role),
    cleanText(project.status),
  ]).join('  |  ');

  if (subline) {
    doc.fontSize(9.5).fillColor(COLORS.muted).text(subline, PAGE_MARGIN_X, cursor, {
      width: CONTENT_WIDTH,
    });
    cursor = doc.y + 5;
  }

  const bullets = toBulletItems(
    [
      project.problem,
      project.approach,
      project.outcomes,
      ...(project.impactMetrics || []),
      project.longDescription,
      project.description,
      ...(project.features || []),
    ],
    3,
    118,
  );

  if (bullets.length > 0) {
    cursor = drawBulletList(doc, bullets, cursor, CONTENT_WIDTH, 10);
  }

  const stackLine = cleanText((project.techStack || []).slice(0, 8).join(', '));
  if (stackLine) {
    doc.fontSize(9.5).fillColor(COLORS.subtle).text(`기술 스택: ${stackLine}`, PAGE_MARGIN_X, cursor, {
      width: CONTENT_WIDTH,
      lineGap: 2,
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

  return cursor + ENTRY_GAP;
}

function drawProjectSection(
  doc: PDFKit.PDFDocument,
  projects: Project[],
  y: number,
): number {
  let cursor = drawSectionHeading(doc, '대표 프로젝트', y);
  const selected = projects.slice(0, 3);

  if (selected.length === 0) {
    doc.fontSize(10).fillColor(COLORS.muted).text('등록된 프로젝트가 없습니다.', PAGE_MARGIN_X, cursor, {
      width: CONTENT_WIDTH,
    });
    return doc.y + SECTION_GAP;
  }

  for (const project of selected) {
    cursor = drawProjectEntry(doc, project, cursor);
  }

  return cursor + 4;
}

function buildPostExcerpt(post: Post): string {
  const base = cleanText(post.excerpt || post.plainText || '');
  if (!base) {
    return '';
  }

  return clampText(base, 140);
}

function drawPostEntry(doc: PDFKit.PDFDocument, post: Post, y: number): number {
  const date = formatDate(post.publishDate);
  const titleWidth = CONTENT_WIDTH - 124;

  doc.fontSize(11).fillColor(COLORS.text).text(cleanText(post.title) || '기술 글', PAGE_MARGIN_X, y, {
    width: titleWidth,
  });

  if (date) {
    doc.fontSize(9.5).fillColor(COLORS.subtle).text(date, PAGE_MARGIN_X + titleWidth + 16, y + 1, {
      width: 108,
      align: 'right',
    });
  }

  let cursor = Math.max(doc.y, y + 16) + 2;
  const excerpt = buildPostExcerpt(post);

  if (excerpt) {
    doc.fontSize(10).fillColor(COLORS.text).text(`- ${excerpt}`, PAGE_MARGIN_X, cursor, {
      width: CONTENT_WIDTH,
      lineGap: 2,
    });
    cursor = doc.y + 4;
  }

  const meta = unique([
    cleanText(post.category),
    (post.tags || []).slice(0, 4).join(', '),
    post.readTime ? `${post.readTime}분 읽기` : '',
  ]).join('  |  ');

  if (meta) {
    doc.fontSize(9.5).fillColor(COLORS.subtle).text(meta, PAGE_MARGIN_X, cursor, {
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

  return cursor + ENTRY_GAP;
}

function drawPostSection(doc: PDFKit.PDFDocument, posts: Post[], y: number): number {
  let cursor = drawSectionHeading(doc, '기술 글', y);
  const selected = posts.slice(0, 2);

  if (selected.length === 0) {
    doc.fontSize(10).fillColor(COLORS.muted).text('선정된 기술 글이 없습니다.', PAGE_MARGIN_X, cursor, {
      width: CONTENT_WIDTH,
    });
    return doc.y + SECTION_GAP;
  }

  for (const post of selected) {
    cursor = drawPostEntry(doc, post, cursor);
  }

  return cursor + 4;
}

function drawClosingSection(doc: PDFKit.PDFDocument, snapshot: PortfolioSnapshot, y: number): number {
  const nextY = drawSectionHeading(doc, '추가 정보', y);
  const lines = unique([
    cleanText(snapshot.profile.statusMessage),
    snapshot.availableForWork ? '현재 새로운 협업과 채용 제안을 열어두고 있습니다.' : '',
    snapshot.profile.email ? `연락: ${snapshot.profile.email}` : '',
  ]).slice(0, 3);

  if (lines.length === 0) {
    doc.fontSize(10).fillColor(COLORS.muted).text('추가로 제공할 정보가 없습니다.', PAGE_MARGIN_X, nextY, {
      width: CONTENT_WIDTH,
    });
    return doc.y + 8;
  }

  doc.fontSize(10).fillColor(COLORS.text).text(lines.join('\n'), PAGE_MARGIN_X, nextY, {
    width: CONTENT_WIDTH,
    lineGap: 4,
  });

  return doc.y + 8;
}

export async function renderResumePdf(snapshot: PortfolioSnapshot): Promise<Buffer> {
  const fontPath = resolveFontPath();

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: PAGE_SIZE,
      margin: 0,
      autoFirstPage: true,
      compress: true,
      font: fontPath,
      info: {
        Title: `${snapshot.profile.name || 'Portfolio'} Resume`,
        Author: snapshot.profile.name || 'Portfolio',
        Subject: 'Portfolio Resume PDF',
      },
    });

    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.registerFont('resume', fontPath);
    doc.font('resume');

    let y = drawHeader(doc, snapshot);

    const summaryBullets = toBulletItems(
      [
        snapshot.profile.subtitle,
        snapshot.profile.about,
        snapshot.profile.description,
        snapshot.profile.statusMessage,
      ],
      3,
      122,
    );

    y = drawSectionHeading(doc, '핵심 요약', y);
    y =
      summaryBullets.length > 0
        ? drawBulletList(doc, summaryBullets, y)
        : (() => {
            doc.fontSize(10).fillColor(COLORS.muted).text('요약 정보가 없습니다.', PAGE_MARGIN_X, y, {
              width: CONTENT_WIDTH,
            });
            return doc.y + 4;
          })();
    y += SECTION_GAP - 8;

    y = drawSkillsSection(doc, snapshot.profile.skills || [], y);
    y = drawExperienceSection(doc, snapshot.experiences || [], y);

    drawFooter(doc, 1, 2);
    doc.addPage({ size: PAGE_SIZE, margin: 0 });
    doc.font('resume');

    y = PAGE_MARGIN_TOP;
    y = drawProjectSection(doc, snapshot.featuredProjects || [], y);
    y = drawPostSection(doc, snapshot.featuredPosts || [], y);
    drawClosingSection(doc, snapshot, y);

    drawFooter(doc, 2, 2);
    doc.end();
  });
}
