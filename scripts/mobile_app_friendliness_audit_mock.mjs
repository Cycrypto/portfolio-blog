import { chromium, devices } from 'playwright';
import { promises as fs } from 'node:fs';
import path from 'node:path';

const BASE_URL = process.env.AUDIT_BASE_URL || 'http://127.0.0.1:3000';
const OUT_DIR = path.resolve(
  '/Users/cycrpto/Desktop/my-blog/output/mobile-app-friendliness-audit/mock-round-2',
);

const scenarios = [
  { name: 'home-top', path: '/', fullPage: false },
  { name: 'home-projects', path: '/', action: 'scroll-projects', fullPage: false },
  { name: 'home-contact', path: '/', action: 'scroll-contact', fullPage: false },
  { name: 'home-menu-open', path: '/', action: 'menu-open', fullPage: false },
  { name: 'projects-full', path: '/projects', fullPage: true },
  { name: 'blog-full', path: '/blog', fullPage: true },
  { name: 'blog-tag-filter', path: '/blog', action: 'select-tag', fullPage: false },
  { name: 'admin-login', path: '/admin/login', fullPage: false },
];

function collectMetrics() {
  const elements = Array.from(document.querySelectorAll('*'));
  const interactiveSelectors = 'a,button,input,textarea,select,[role="button"]';
  const getStyle = (element) => window.getComputedStyle(element);
  const isVisible = (element) => {
    const style = getStyle(element);
    const rect = element.getBoundingClientRect();
    return (
      style.display !== 'none' &&
      style.visibility !== 'hidden' &&
      rect.width > 0 &&
      rect.height > 0
    );
  };
  const textFor = (element) =>
    (element.getAttribute('aria-label') ||
      element.textContent ||
      element.getAttribute('placeholder') ||
      element.getAttribute('name') ||
      element.tagName)
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 80);
  const visibleInteractive = Array.from(document.querySelectorAll(interactiveSelectors)).filter(isVisible);
  const smallTargets = visibleInteractive
    .map((element) => {
      const rect = element.getBoundingClientRect();
      return {
        tag: element.tagName.toLowerCase(),
        text: textFor(element),
        width: Math.round(rect.width * 10) / 10,
        height: Math.round(rect.height * 10) / 10,
      };
    })
    .filter((item) => item.width < 44 || item.height < 44)
    .slice(0, 20);

  return {
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
    },
    document: {
      scrollWidth: document.documentElement.scrollWidth,
      scrollHeight: document.documentElement.scrollHeight,
    },
    horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 1,
    fixedStickyCount: elements.filter((element) => {
      const position = getStyle(element).position;
      return position === 'fixed' || position === 'sticky';
    }).length,
    sections: Array.from(document.querySelectorAll('section')).map(
      (element) => element.id || '(no-id)',
    ),
    visibleInteractiveCount: visibleInteractive.length,
    smallTargets,
  };
}

async function runScenario(context, scenario) {
  const page = await context.newPage();
  const consoleErrors = [];

  page.on('console', (message) => {
    if (message.type() === 'error') {
      consoleErrors.push(message.text());
    }
  });

  page.on('pageerror', (error) => {
    consoleErrors.push(String(error));
  });

  await page.goto(`${BASE_URL}${scenario.path}`, {
    waitUntil: 'networkidle',
    timeout: 45000,
  });
  await page.waitForTimeout(900);

  if (scenario.action === 'scroll-projects') {
    await page.locator('#projects').scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
  }

  if (scenario.action === 'scroll-contact') {
    await page.locator('#contact').scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
  }

  if (scenario.action === 'menu-open') {
    await page.evaluate(() => window.scrollTo({ top: 960, behavior: 'instant' }));
    await page.waitForTimeout(500);
    await page.locator('button').first().click();
    await page.waitForTimeout(300);
  }

  if (scenario.action === 'select-tag') {
    const tagButton = page.getByRole('button', { name: /NestJS/i });
    if (await tagButton.count()) {
      await tagButton.first().click();
      await page.waitForTimeout(500);
    }
  }

  const screenshotPath = path.join(OUT_DIR, `${scenario.name}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: scenario.fullPage });
  const metrics = await page.evaluate(collectMetrics);
  metrics.consoleErrors = consoleErrors;

  await page.close();

  return {
    screenshotPath,
    metrics,
  };
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    ...devices['iPhone 13'],
  });

  const report = {
    generatedAt: new Date().toISOString(),
    device: 'iPhone 13',
    baseUrl: BASE_URL,
    scenarios: {},
  };

  for (const scenario of scenarios) {
    report.scenarios[scenario.name] = await runScenario(context, scenario);
  }

  await context.close();
  await browser.close();

  const reportPath = path.join(OUT_DIR, 'report.json');
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
  console.log(`Saved mock mobile audit report to ${reportPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
