import { chromium, devices } from 'playwright';
import { promises as fs } from 'node:fs';
import path from 'node:path';

const BASE_URL = 'http://127.0.0.1:3000';
const OUT_DIR = '/Users/cycrpto/Desktop/my-blog/output/admin-ui-audit-after';

const targets = [
  { name: 'admin-login', url: `${BASE_URL}/admin/login`, auth: false },
  { name: 'admin-dashboard', url: `${BASE_URL}/admin`, auth: true },
  { name: 'admin-posts', url: `${BASE_URL}/admin/posts`, auth: true },
  { name: 'admin-projects', url: `${BASE_URL}/admin/projects`, auth: true },
  { name: 'admin-contacts', url: `${BASE_URL}/admin/contacts`, auth: true },
];

function collectMetrics() {
  const elements = Array.from(document.querySelectorAll('*'));
  const getStyle = (el) => window.getComputedStyle(el);
  const count = (predicate) => elements.reduce((acc, el) => acc + (predicate(el) ? 1 : 0), 0);

  return {
    buttons: document.querySelectorAll('button').length,
    links: document.querySelectorAll('a').length,
    inputs: document.querySelectorAll('input,textarea,select').length,
    tables: document.querySelectorAll('table').length,
    animatedCount: count((el) => {
      const s = getStyle(el);
      return s.animationName && s.animationName !== 'none';
    }),
    blurCount: count((el) => {
      const s = getStyle(el);
      return (s.filter && s.filter.includes('blur')) || (s.backdropFilter && s.backdropFilter.includes('blur'));
    }),
    fixedStickyCount: count((el) => {
      const p = getStyle(el).position;
      return p === 'fixed' || p === 'sticky';
    }),
  };
}

async function capture(context, target, prefix) {
  const page = await context.newPage();
  const logs = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') logs.push(msg.text());
  });

  if (target.auth) {
    await page.addInitScript(() => {
      localStorage.setItem('auth_token', 'codex-admin-token');
    });
  }

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

  report.mobile.dashboard = await capture(mobile, { name: 'admin-dashboard', url: `${BASE_URL}/admin`, auth: true }, 'mobile');

  await desktop.close();
  await mobile.close();
  await browser.close();

  const reportPath = path.join(OUT_DIR, 'report.json');
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
  console.log(`Saved report: ${reportPath}`);

  for (const [name, item] of Object.entries(report.desktop)) {
    const m = item.metrics;
    console.log(`[desktop/${name}] buttons=${m.buttons} links=${m.links} inputs=${m.inputs} tables=${m.tables} animated=${m.animatedCount} blur=${m.blurCount}`);
  }
  const mm = report.mobile.dashboard.metrics;
  console.log(`[mobile/dashboard] buttons=${mm.buttons} links=${mm.links} inputs=${mm.inputs} tables=${mm.tables} animated=${mm.animatedCount} blur=${mm.blurCount}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
