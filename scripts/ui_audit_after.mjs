import { chromium, devices } from 'playwright';
import { promises as fs } from 'node:fs';
import path from 'node:path';

const BASE_URL = 'http://127.0.0.1:3000';
const OUT_DIR = '/Users/cycrpto/Desktop/my-blog/output/ui-audit-after';

const targets = [
  { name: 'home', url: `${BASE_URL}/` },
  { name: 'blog', url: `${BASE_URL}/blog` },
  { name: 'projects', url: `${BASE_URL}/projects` },
];

function collectMetrics() {
  const elements = Array.from(document.querySelectorAll('*'));
  const getStyle = (el) => window.getComputedStyle(el);
  const count = (predicate) => elements.reduce((acc, el) => acc + (predicate(el) ? 1 : 0), 0);

  const sectionNodes = Array.from(document.querySelectorAll('section'));

  return {
    sections: sectionNodes.length,
    sectionIds: sectionNodes.map((s) => s.id || '(no-id)'),
    buttons: document.querySelectorAll('button').length,
    links: document.querySelectorAll('a').length,
    inputs: document.querySelectorAll('input,textarea,select').length,
    animatedCount: count((el) => {
      const s = getStyle(el);
      return s.animationName && s.animationName !== 'none';
    }),
    blurCount: count((el) => {
      const s = getStyle(el);
      return (s.filter && s.filter.includes('blur')) || (s.backdropFilter && s.backdropFilter.includes('blur'));
    }),
    gradientClassCount: count((el) => (el.className || '').toString().includes('gradient')),
    fixedStickyCount: count((el) => {
      const p = getStyle(el).position;
      return p === 'fixed' || p === 'sticky';
    }),
    viewport: { width: window.innerWidth, height: window.innerHeight },
  };
}

async function capture(context, target, prefix) {
  const page = await context.newPage();
  const logs = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') logs.push(msg.text());
  });

  await page.goto(target.url, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(1200);

  const screenshotPath = path.join(OUT_DIR, `${prefix}-${target.name}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  const metrics = await page.evaluate(collectMetrics);
  metrics.logs = logs;

  await page.close();
  return { screenshotPath, metrics };
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const mobile = await browser.newContext({ ...devices['iPhone 13'] });

  const report = { generatedAt: new Date().toISOString(), desktop: {}, mobile: {} };

  for (const target of targets) {
    report.desktop[target.name] = await capture(desktop, target, 'desktop');
  }

  report.mobile.home = await capture(mobile, { name: 'home', url: `${BASE_URL}/` }, 'mobile');

  await desktop.close();
  await mobile.close();
  await browser.close();

  const reportPath = path.join(OUT_DIR, 'report.json');
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
  console.log(`Saved report: ${reportPath}`);

  for (const [name, data] of Object.entries(report.desktop)) {
    const m = data.metrics;
    console.log(`[desktop/${name}] sections=${m.sections} buttons=${m.buttons} links=${m.links} animated=${m.animatedCount} blur=${m.blurCount} gradients=${m.gradientClassCount}`);
  }
  const mm = report.mobile.home.metrics;
  console.log(`[mobile/home] sections=${mm.sections} buttons=${mm.buttons} links=${mm.links} animated=${mm.animatedCount} blur=${mm.blurCount} gradients=${mm.gradientClassCount}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
