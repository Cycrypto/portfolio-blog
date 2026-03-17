import { readFile } from 'node:fs/promises';
import path from 'node:path';

import PDFDocument from 'pdfkit';

import type { PortfolioSnapshot } from '@/lib/portfolio/build-portfolio-snapshot';
import { getPostPath } from '@/lib/posts/post-url';
import { absoluteUrl } from '@/lib/site';

const PAGE_MARGIN = 48;
const PAGE_WIDTH = 595.28;
const CONTENT_WIDTH = PAGE_WIDTH - PAGE_MARGIN * 2;
const BRAND_BLUE = '#213448';
const SUBTLE_BLUE = '#547792';
const LIGHT_BLUE = '#EAF1F5';
const TEXT_PRIMARY = '#233547';
const TEXT_MUTED = '#5E7185';
const MAX_PROJECTS = 3;
const MAX_POSTS = 2;

function drawFooter(doc: PDFKit.PDFDocument, pageNumber: number) {
  doc
    .save()
    .font('body')
    .fillColor(TEXT_MUTED)
    .fontSize(8.5)
    .text(
      `박준하 포트폴리오 이력서 | ${pageNumber}`,
      PAGE_MARGIN,
      doc.page.height - PAGE_MARGIN - 12,
      {
        width: CONTENT_WIDTH,
        align: 'right',
        lineBreak: false,
      },
    )
    .restore();
}

function clampText(value: string | undefined, limit: number): string {
  if (!value) {
    return '';
  }

  const normalized = value.replace(/\s+/g, ' ').trim();
  if (normalized.length <= limit) {
    return normalized;
  }

  return `${normalized.slice(0, limit - 1).trimEnd()}…`;
}

function formatPeriod(startDate?: string, endDate?: string) {
  if (!startDate && !endDate) {
    return '기간 정리 중';
  }

  const formatter = new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'short',
  });
  const format = (value?: string) =>
    value ? formatter.format(new Date(value)) : '현재';

  if (startDate && endDate) {
    return `${format(startDate)} - ${format(endDate)}`;
  }

  if (startDate) {
    return `${format(startDate)} - 현재`;
  }

  return `${format(endDate)} 종료`;
}

async function loadProfileImage(profileImage?: string): Promise<Buffer | null> {
  if (!profileImage) {
    return null;
  }

  try {
    if (profileImage.startsWith('http://') || profileImage.startsWith('https://')) {
      const response = await fetch(profileImage);
      if (!response.ok) {
        return null;
      }

      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    }

    const normalizedPath = profileImage.startsWith('/')
      ? profileImage.slice(1)
      : profileImage;
    const filePath = path.join(process.cwd(), 'public', normalizedPath);
    return await readFile(filePath);
  } catch (error) {
    return null;
  }
}

function drawSectionTitle(doc: PDFKit.PDFDocument, title: string, y: number) {
  doc
    .fillColor(BRAND_BLUE)
    .fontSize(14)
    .text(title, PAGE_MARGIN, y, {
      width: CONTENT_WIDTH,
    });

  doc
    .moveTo(PAGE_MARGIN, y + 20)
    .lineTo(PAGE_MARGIN + CONTENT_WIDTH, y + 20)
    .lineWidth(1)
    .strokeColor('#D6E4EC')
    .stroke();

  return y + 30;
}

function ensurePage(
  doc: PDFKit.PDFDocument,
  y: number,
  requiredHeight: number,
  pageFooterSpace = 44,
) {
  if (y + requiredHeight <= doc.page.height - pageFooterSpace) {
    return y;
  }

  doc.addPage();
  return PAGE_MARGIN;
}

async function loadFontPath() {
  return path.join(process.cwd(), 'public', 'fonts', 'AppleMyungjo.ttf');
}

export async function renderResumePdf(
  snapshot: PortfolioSnapshot,
): Promise<Buffer> {
  const fontPath = await loadFontPath();
  const profileImageBuffer = await loadProfileImage(snapshot.profile.profileImage);

  const doc = new PDFDocument({
    size: 'A4',
    margin: PAGE_MARGIN,
    font: fontPath,
    info: {
      Title: `${snapshot.profile.name} Resume`,
      Author: snapshot.profile.name,
    },
  });

  doc.registerFont('body', fontPath);
  doc.font('body');
  let pageNumber = 1;
  drawFooter(doc, pageNumber);
  doc.on('pageAdded', () => {
    pageNumber += 1;
    doc.font('body');
    drawFooter(doc, pageNumber);
  });

  const chunks: Buffer[] = [];
  const bufferPromise = new Promise<Buffer>((resolve, reject) => {
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });

  doc.roundedRect(PAGE_MARGIN, 40, CONTENT_WIDTH, 126, 18).fill(BRAND_BLUE);

  if (profileImageBuffer) {
    doc.save();
    doc.roundedRect(PAGE_MARGIN + CONTENT_WIDTH - 94, 58, 72, 72, 18).clip();
    doc.image(profileImageBuffer, PAGE_MARGIN + CONTENT_WIDTH - 94, 58, {
      width: 72,
      height: 72,
    });
    doc.restore();
  }

  doc.fillColor('#FFFFFF').fontSize(26).text(snapshot.profile.name, 64, 60);
  doc.fontSize(13).text(snapshot.profile.title || '백엔드 개발자', 64, 92);
  doc
    .fillColor('#E6EEF5')
    .fontSize(10)
    .text(
      clampText(
        snapshot.profile.subtitle || snapshot.profile.description,
        120,
      ),
      64,
      114,
      {
        width: CONTENT_WIDTH - 140,
      },
    );

  const contactLines = [
    snapshot.profile.email,
    snapshot.profile.github,
    snapshot.profile.linkedin,
    snapshot.profile.location,
  ].filter(Boolean);
  doc
    .fillColor('#F5FAFF')
    .fontSize(9)
    .text(contactLines.join('  |  '), 64, 145, {
      width: CONTENT_WIDTH - 40,
    });

  let y = 188;
  y = drawSectionTitle(doc, '요약', y);
  doc
    .fillColor(TEXT_PRIMARY)
    .fontSize(10.5)
    .text(
      clampText(
        [snapshot.profile.about, snapshot.profile.description]
          .filter(Boolean)
          .join(' '),
        260,
      ) || '요약 정보를 정리 중입니다.',
      PAGE_MARGIN,
      y,
      {
        width: CONTENT_WIDTH,
        lineGap: 4,
      },
    );
  y = doc.y + 18;

  y = drawSectionTitle(doc, '핵심 기술', y);
  const skillText =
    snapshot.profile.skills
      ?.slice(0, 8)
      .map((skill) => `${skill.name} (${skill.level}%)`)
      .join('  ·  ') || '기술 스택 정리 중';
  doc.fillColor(TEXT_PRIMARY).fontSize(10.5).text(skillText, PAGE_MARGIN, y, {
    width: CONTENT_WIDTH,
    lineGap: 4,
  });
  y = doc.y + 18;

  y = drawSectionTitle(doc, '경력', y);
  const experienceSummaryLimit = snapshot.experiences.length > 4 ? 90 : 130;
  if (snapshot.experiences.length === 0) {
    doc
      .fillColor(TEXT_MUTED)
      .fontSize(9.5)
      .text('경력 정보를 정리 중입니다.', PAGE_MARGIN, y, {
        width: CONTENT_WIDTH,
      });
    y = doc.y + 14;
  } else {
    for (const experience of snapshot.experiences) {
      y = ensurePage(doc, y, 78);
      doc.fillColor(TEXT_PRIMARY).fontSize(11.5).text(experience.title, PAGE_MARGIN, y);
      doc
        .fillColor(SUBTLE_BLUE)
        .fontSize(9.5)
        .text(
          `${experience.company} | ${formatPeriod(
            experience.startDate,
            experience.endDate,
          )}`,
          PAGE_MARGIN,
          y + 16,
        );
      doc
        .fillColor(TEXT_MUTED)
        .fontSize(9.5)
        .text(
          clampText(experience.description, experienceSummaryLimit) ||
            '상세 역할을 정리 중입니다.',
          PAGE_MARGIN,
          y + 34,
          {
            width: CONTENT_WIDTH,
            lineGap: 3,
          },
        );
      y = doc.y + 14;
    }
  }

  if (pageNumber === 1) {
    doc.addPage();
    y = PAGE_MARGIN;
  }

  y = drawSectionTitle(doc, '대표 프로젝트', y);
  const projectSummaryLimit = snapshot.featuredProjects.length > 2 ? 96 : 120;
  const projects = snapshot.featuredProjects.slice(0, MAX_PROJECTS);
  if (projects.length === 0) {
    doc
      .fillColor(TEXT_MUTED)
      .fontSize(9.5)
      .text('대표 프로젝트를 정리 중입니다.', PAGE_MARGIN, y, {
        width: CONTENT_WIDTH,
      });
    y = doc.y + 14;
  } else {
    for (const project of projects) {
      y = ensurePage(doc, y, 96);
      doc
        .roundedRect(PAGE_MARGIN, y, CONTENT_WIDTH, 74, 14)
        .fillColor(LIGHT_BLUE)
        .fill();
      doc
        .fillColor(BRAND_BLUE)
        .fontSize(11.5)
        .text(project.title, PAGE_MARGIN + 14, y + 12, {
          width: CONTENT_WIDTH - 28,
        });
      const subtitle = [project.role, project.status]
        .filter(Boolean)
        .join(' | ');
      doc
        .fillColor(SUBTLE_BLUE)
        .fontSize(9)
        .text(
          subtitle || formatPeriod(project.startDate, project.endDate),
          PAGE_MARGIN + 14,
          y + 28,
          {
            width: CONTENT_WIDTH - 28,
          },
        );
      const projectSummary =
        clampText(project.problem, projectSummaryLimit) ||
        clampText(project.description, projectSummaryLimit) ||
        '프로젝트 설명을 정리 중입니다.';
      doc
        .fillColor(TEXT_PRIMARY)
        .fontSize(9.5)
        .text(projectSummary, PAGE_MARGIN + 14, y + 42, {
          width: CONTENT_WIDTH - 28,
          lineGap: 3,
        });
      if ((project.impactMetrics || []).length > 0) {
        doc
          .fillColor(TEXT_MUTED)
          .fontSize(8.5)
          .text(
            `성과: ${project.impactMetrics.slice(0, 3).join(' · ')}`,
            PAGE_MARGIN + 14,
            y + 60,
            {
              width: CONTENT_WIDTH - 28,
            },
          );
      }
      y += 88;
    }
  }

  y += 4;
  y = ensurePage(doc, y, 92);
  y = drawSectionTitle(doc, '대표 기술 글', y);
  const posts = snapshot.featuredPosts.slice(0, MAX_POSTS);
  if (posts.length === 0) {
    doc
      .fillColor(TEXT_MUTED)
      .fontSize(9.5)
      .text('대표 기술 글을 정리 중입니다.', PAGE_MARGIN, y);
    y = doc.y + 12;
  } else {
    for (const post of posts) {
      y = ensurePage(doc, y, 62);
      doc.fillColor(TEXT_PRIMARY).fontSize(11).text(post.title, PAGE_MARGIN, y, {
        width: CONTENT_WIDTH,
      });
      doc
        .fillColor(SUBTLE_BLUE)
        .fontSize(8.8)
        .text(
          `${post.category} | ${new Date(post.publishDate).toLocaleDateString(
            'ko-KR',
          )} | ${absoluteUrl(getPostPath(post))}`,
          PAGE_MARGIN,
          y + 15,
          {
            width: CONTENT_WIDTH,
          },
        );
      doc
        .fillColor(TEXT_MUTED)
        .fontSize(9)
        .text(
          clampText(post.excerpt || post.plainText, 130) ||
            '요약을 정리 중입니다.',
          PAGE_MARGIN,
          y + 30,
          {
            width: CONTENT_WIDTH,
            lineGap: 3,
          },
        );
      y = doc.y + 12;
    }
  }

  doc.end();
  return bufferPromise;
}
