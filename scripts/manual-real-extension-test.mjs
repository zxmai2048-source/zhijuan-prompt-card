import http from 'node:http';
import { cp, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distDir = path.join(rootDir, 'dist');
const tempDistDir = '/tmp/zhijuan-dist-manual-real-test';
const artifactsDir = path.join(rootDir, 'tmp/browser-tests');
const userDataDir = path.join(rootDir, 'tmp/pw-chromium-zhijuan-real-profile');
const storageKey = 'zhijuan.history';

const realSettings = {
  baseUrl: process.env.ZHIJUAN_TEST_BASE_URL || 'http://127.0.0.1:8876/v1',
  apiKey: process.env.ZHIJUAN_TEST_API_KEY || 'local-bridge',
  model: process.env.ZHIJUAN_TEST_MODEL || 'gpt-5.5'
};

const pageImage = process.env.ZHIJUAN_TEST_PAGE_IMAGE || 'docs/assets/readme/imagegen/readme-banner.png';
const localImage = process.env.ZHIJUAN_TEST_LOCAL_IMAGE || 'docs/assets/readme/imagegen/readme-workflow.png';

const testPageHtml = `<!doctype html>
<meta charset="utf-8" />
<title>Zhijuan manual real-image test</title>
<style>
  body { margin: 0; background: #12161d; color: #f4f7f2; font-family: system-ui, -apple-system, BlinkMacSystemFont, sans-serif; }
  main { max-width: 1120px; margin: 0 auto; padding: 40px 28px 80px; }
  h1 { font-size: 28px; margin: 0 0 18px; }
  p { color: #b8c3bd; margin: 0 0 24px; }
  .grid { display: grid; grid-template-columns: 1fr; gap: 28px; }
  img { width: 100%; height: auto; display: block; border: 1px solid rgba(255,255,255,.14); background: #0b0f15; }
</style>
<main>
  <h1>Zhijuan manual real-image test page</h1>
  <p>Project README images used as real page-image fixtures.</p>
  <div class="grid">
    <img id="page-test-image" src="/${pageImage}" alt="Zhijuan README banner test image" />
    <img src="/docs/assets/readme/imagegen/readme-local-first.png" alt="Zhijuan local first test image" />
  </div>
</main>`;

function serveStaticFile(filePath, res) {
  return readFile(filePath)
    .then((buffer) => {
      const ext = path.extname(filePath).toLowerCase();
      const type =
        ext === '.png' ? 'image/png' : ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : ext === '.html' ? 'text/html; charset=utf-8' : 'application/octet-stream';
      res.writeHead(200, { 'content-type': type });
      res.end(buffer);
    })
    .catch(() => {
      res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
      res.end('not found');
    });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', 'http://127.0.0.1');
  if (url.pathname === '/' || url.pathname === '/manual-real-test.html') {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    res.end(testPageHtml);
    return;
  }

  const requested = decodeURIComponent(url.pathname.replace(/^\/+/, ''));
  const filePath = path.normalize(path.join(rootDir, requested));
  if (!filePath.startsWith(rootDir)) {
    res.writeHead(403, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('forbidden');
    return;
  }
  await serveStaticFile(filePath, res);
});

function listen() {
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => resolve(server.address()));
  });
}

async function shadowRect(page, spec) {
  return page.evaluate((spec) => {
    const root = document.getElementById('zhijuan-prompt-root')?.shadowRoot;
    if (!root) throw new Error('missing shadow root');

    let element;
    if (spec.selector) {
      element = root.querySelector(spec.selector);
    } else {
      element = [...root.querySelectorAll('button')].find((button) => {
        const text = (button.textContent || '').trim().replace(/\s+/g, ' ');
        const aria = button.getAttribute('aria-label') || '';
        const title = button.getAttribute('title') || '';
        return spec.exact ? text === spec.text || aria === spec.text || title === spec.text : text.includes(spec.text) || aria.includes(spec.text) || title.includes(spec.text);
      });
    }

    if (!element) throw new Error(`missing shadow element ${JSON.stringify(spec)}`);
    const rect = element.getBoundingClientRect();
    return {
      x: rect.x,
      y: rect.y,
      w: rect.width,
      h: rect.height,
      text: (element.textContent || element.getAttribute('aria-label') || element.getAttribute('title') || '').trim().replace(/\s+/g, ' ')
    };
  }, spec);
}

async function clickShadow(page, spec) {
  const rect = await shadowRect(page, spec);
  await page.mouse.click(rect.x + rect.w / 2, rect.y + rect.h / 2);
  return rect;
}

async function readHistory(extensionPage) {
  return extensionPage.evaluate(
    (key) =>
      new Promise((resolve) => {
        chrome.storage.local.get([key], (record) => resolve(Array.isArray(record[key]) ? record[key] : []));
      }),
    storageKey
  );
}

async function readAllStorage(extensionPage) {
  return extensionPage.evaluate(
    () =>
      new Promise((resolve) => {
        chrome.storage.local.get(null, (record) => resolve(record));
      })
  );
}

async function waitForNewSuccess(extensionPage, previousIds, label) {
  const deadline = Date.now() + 180_000;
  let lastFreshEntries = [];
  while (Date.now() < deadline) {
    const history = await readHistory(extensionPage);
    const freshEntries = history.filter((entry) => !previousIds.includes(entry.id));
    lastFreshEntries = freshEntries;
    const failed = freshEntries.find((entry) => entry.status === 'failed');
    if (failed) throw new Error(`${label}: ${failed.error || 'analysis failed'}`);

    const successful = freshEntries.find((entry) => entry.status === 'success' && entry.analysis);
    if (successful) {
      validateAnalysisEntry(successful, label);
      return successful;
    }
    await delay(700);
  }
  throw new Error(`${label}: timed out waiting for successful history entry\n${JSON.stringify(lastFreshEntries.map(summarizePossiblyInvalidEntry), null, 2)}`);
}

function validateAnalysisEntry(entry, label) {
  const analysis = entry?.analysis || {};
  const enPrompt = analysis.en?.prompt || '';
  const promptWords = enPrompt.trim().split(/\s+/).filter(Boolean).length;
  const jsonPrompt = analysis.json_prompt || {};
  const priorities = jsonPrompt.fidelity_priorities;
  const observationUnits = jsonPrompt.observation_units;
  const reconstructionPriorities = jsonPrompt.reconstruction_priorities;
  const globalFingerprint = jsonPrompt.global_fingerprint;
  const generationPrompt = jsonPrompt.generation_prompt;
  const generationNegativePrompt = jsonPrompt.generation_negative_prompt;
  const spatialDynamics = jsonPrompt.spatial_dynamics;
  const negative = analysis.negative_prompt;
  const topLevelKeys = Object.keys(analysis).sort();

  const fail = (message) => {
    throw new Error(`${label}: ${message}\n${JSON.stringify(summarizePossiblyInvalidEntry(entry), null, 2)}`);
  };

  if (analysis.ja) fail('unexpected ja output');
  if (analysis.recreation_prompt) fail('unexpected recreation_prompt output');
  if (!analysis.en?.prompt) fail('missing en.prompt');
  if (promptWords < 80) fail(`en.prompt too short: ${promptWords}`);
  if (jsonPrompt.schema_version !== 'reconstruction_v2') fail(`invalid schema_version: ${jsonPrompt.schema_version}`);
  if (!Array.isArray(priorities) || priorities.length < 3 || priorities.length > 7) fail('invalid fidelity_priorities');
  if (!priorities.every((item) => /priority\s+\d{1,3}\s+of\s+100/i.test(String(item)))) fail('fidelity priorities missing priority wording');
  if (!globalFingerprint || typeof globalFingerprint !== 'object' || !Number.isFinite(globalFingerprint.style_index)) fail('missing global_fingerprint.style_index');
  if (!Array.isArray(observationUnits) || observationUnits.length < 3) fail('observation_units too weak');
  if (!observationUnits.every((unit) => unit?.prompt && Number.isFinite(unit?.priority))) fail('invalid observation_units payload');
  if (!Array.isArray(reconstructionPriorities) || reconstructionPriorities.length < 1) fail('missing reconstruction_priorities');
  if (!reconstructionPriorities.every((item) => item?.cue && Number.isFinite(item?.priority))) fail('invalid reconstruction_priorities payload');
  const generationPromptWords = typeof generationPrompt === 'string' ? generationPrompt.trim().split(/\s+/).filter(Boolean).length : 0;
  if (generationPromptWords < 80) fail('json_prompt.generation_prompt too weak');
  if (generationPromptWords < promptWords) fail('json_prompt.generation_prompt weaker than en.prompt');
  if (typeof generationNegativePrompt !== 'string' || generationNegativePrompt.split(',').filter(Boolean).length < 8) fail('json_prompt.generation_negative_prompt too weak');
  if (typeof spatialDynamics !== 'string' || spatialDynamics.trim().split(/\s+/).filter(Boolean).length < 20) fail('json_prompt.spatial_dynamics too weak');
  if (typeof negative !== 'string' || negative.split(',').filter(Boolean).length < 8) fail('negative_prompt too weak');
  if (!topLevelKeys.includes('en_style_tags') || !topLevelKeys.includes('json_prompt')) fail('missing expected top-level fields');
}

function summarizeEntry(entry) {
  const analysis = entry.analysis;
  const enPrompt = analysis.en?.prompt || '';
  return {
    id: entry.id,
    title: entry.title,
    status: entry.status,
    topLevelKeys: Object.keys(analysis).sort(),
    hasJa: Boolean(analysis.ja),
    hasRecreationPrompt: Boolean(analysis.recreation_prompt),
    enPromptWords: enPrompt.trim().split(/\s+/).filter(Boolean).length,
    negativeItems: typeof analysis.negative_prompt === 'string' ? analysis.negative_prompt.split(',').filter(Boolean).length : null,
    schemaVersion: analysis.json_prompt?.schema_version,
    generationPromptWords:
      typeof analysis.json_prompt?.generation_prompt === 'string' ? analysis.json_prompt.generation_prompt.trim().split(/\s+/).filter(Boolean).length : null,
    generationNegativeItems:
      typeof analysis.json_prompt?.generation_negative_prompt === 'string' ? analysis.json_prompt.generation_negative_prompt.split(',').filter(Boolean).length : null,
    spatialDynamicsWords:
      typeof analysis.json_prompt?.spatial_dynamics === 'string' ? analysis.json_prompt.spatial_dynamics.trim().split(/\s+/).filter(Boolean).length : null,
    observationUnitCount: Array.isArray(analysis.json_prompt?.observation_units) ? analysis.json_prompt.observation_units.length : null,
    reconstructionPriorityCount: Array.isArray(analysis.json_prompt?.reconstruction_priorities) ? analysis.json_prompt.reconstruction_priorities.length : null,
    fidelityPriorities: analysis.json_prompt?.fidelity_priorities,
    enPromptPreview: enPrompt.slice(0, 600)
  };
}

function summarizePossiblyInvalidEntry(entry) {
  const analysis = entry?.analysis || {};
  return {
    id: entry?.id,
    title: entry?.title,
    status: entry?.status,
    error: entry?.error,
    analysisType: typeof analysis,
    topLevelKeys: analysis && typeof analysis === 'object' ? Object.keys(analysis).sort() : [],
    analysisPreview: JSON.stringify(analysis).slice(0, 1200)
  };
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function publicSettings(settings) {
  return {
    baseUrl: settings.baseUrl,
    apiKey: settings.apiKey ? '[redacted]' : '',
    model: settings.model
  };
}

function redactSecrets(value) {
  if (Array.isArray(value)) return value.map(redactSecrets);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => {
      if (/api.?key|authorization|bearer|token|secret|password/i.test(key)) return [key, item ? '[redacted]' : item];
      return [key, redactSecrets(item)];
    })
  );
}

async function run() {
  await stat(distDir);
  await stat(path.join(rootDir, pageImage));
  await stat(path.join(rootDir, localImage));
  await mkdir(artifactsDir, { recursive: true });
  await rm(userDataDir, { recursive: true, force: true });
  await rm(tempDistDir, { recursive: true, force: true });
  await cp(distDir, tempDistDir, { recursive: true });

  const address = await listen();
  const pageUrl = `http://127.0.0.1:${address.port}/manual-real-test.html`;
  const evidence = {
    browser: 'playwright-chromium-temp-profile',
    settings: publicSettings(realSettings),
    pageUrl,
    pageImage,
    localImage,
    checks: [],
    screenshots: {},
    entries: [],
    workerConsole: [],
    pageConsole: []
  };

  let context;
  let optionsPage;
  let page;
  let popupPage;
  let historyPage;
  context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    ignoreDefaultArgs: ['--disable-extensions'],
    viewport: { width: 1440, height: 900 },
    args: [`--disable-extensions-except=${tempDistDir}`, `--load-extension=${tempDistDir}`, '--no-first-run', '--no-default-browser-check']
  });

  try {
    const worker = context.serviceWorkers()[0] || (await context.waitForEvent('serviceworker', { timeout: 15_000 }));
    worker.on('console', (message) => evidence.workerConsole.push({ type: message.type(), text: message.text() }));
    const extensionId = new URL(worker.url()).host;
    evidence.extensionId = extensionId;

    optionsPage = await context.newPage();
    optionsPage.on('console', (message) => evidence.pageConsole.push({ page: 'options', type: message.type(), text: message.text() }));
    await optionsPage.goto(`chrome-extension://${extensionId}/options.html`);
    await optionsPage.waitForSelector('input');
    await optionsPage.locator('input').nth(0).fill(realSettings.baseUrl);
    await optionsPage.locator('input').nth(1).fill(realSettings.apiKey);
    await optionsPage.locator('input').nth(2).fill(realSettings.model);
    await optionsPage.getByRole('button', { name: '保存并测试' }).click();
    await optionsPage.waitForFunction(() => document.body.innerText.includes('Connection ok. Schema ok.'), null, { timeout: 180_000 });
    evidence.checks.push('options_real_bridge_save_and_test_ok');

    page = await context.newPage();
    page.on('console', (message) => evidence.pageConsole.push({ page: 'test-page', type: message.type(), text: message.text() }));
    await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: new URL(pageUrl).origin });
    await page.goto(pageUrl, { waitUntil: 'domcontentloaded', timeout: 45_000 });
    await page.waitForFunction(() => Boolean(document.getElementById('zhijuan-prompt-root')?.shadowRoot), null, { timeout: 20_000 });
    await page.waitForSelector('#page-test-image');
    await page.waitForFunction(() => {
      const image = document.querySelector('#page-test-image');
      return image?.complete && image.naturalWidth > 100 && image.naturalHeight > 100;
    });
    const testPageScreenshot = path.join(artifactsDir, `manual-real-test-page-${Date.now()}.png`);
    await page.screenshot({ path: testPageScreenshot, fullPage: false });
    evidence.screenshots.testPage = testPageScreenshot;
    evidence.checks.push('manual_test_page_loaded');

    const beforePagePick = (await readHistory(optionsPage)).map((entry) => entry.id);
    await clickShadow(page, { selector: '.zpc-collapsed-handle' });
    await page.waitForTimeout(400);
    await clickShadow(page, { text: '选择图片', exact: true });
    await page.waitForSelector('.zpc-image-pick-overlay');
    const imageRect = await page.locator('#page-test-image').boundingBox();
    if (!imageRect) throw new Error('missing page image rect');
    await page.mouse.move(imageRect.x + imageRect.width / 2, imageRect.y + Math.min(imageRect.height / 2, 320));
    await page.waitForTimeout(320);
    await page.mouse.click(imageRect.x + imageRect.width / 2, imageRect.y + Math.min(imageRect.height / 2, 320));
    const pagePickEntry = await waitForNewSuccess(optionsPage, beforePagePick, 'page image pick');
    evidence.entries.push({ kind: 'page_image_pick', ...summarizeEntry(pagePickEntry) });
    evidence.checks.push('page_image_pick_real_model_success');

    await clickShadow(page, { text: '英文', exact: true }).catch(() => undefined);
    const pagePickScreenshot = path.join(artifactsDir, `manual-real-page-pick-result-${Date.now()}.png`);
    await page.screenshot({ path: pagePickScreenshot, fullPage: false });
    evidence.screenshots.pagePickResult = pagePickScreenshot;

    const beforeLocal = (await readHistory(optionsPage)).map((entry) => entry.id);
    popupPage = await context.newPage();
    popupPage.on('console', (message) => evidence.pageConsole.push({ page: 'popup', type: message.type(), text: message.text() }));
    await popupPage.goto(`chrome-extension://${extensionId}/popup.html`);
    await popupPage.waitForSelector('#zpc-local-file-input');
    await popupPage.locator('#zpc-local-file-input').setInputFiles(path.join(rootDir, localImage));
    const localEntry = await waitForNewSuccess(optionsPage, beforeLocal, 'local file upload');
    evidence.entries.push({ kind: 'local_file_upload', ...summarizeEntry(localEntry) });
    evidence.checks.push('local_file_upload_real_model_success');

    historyPage = await context.newPage();
    historyPage.on('console', (message) => evidence.pageConsole.push({ page: 'history', type: message.type(), text: message.text() }));
    await historyPage.goto(`chrome-extension://${extensionId}/popup.html#history`);
    await historyPage.waitForFunction(() => document.body.innerText.includes('历史') || document.body.innerText.includes('History'), null, { timeout: 20_000 });
    const historyScreenshot = path.join(artifactsDir, `manual-real-history-${Date.now()}.png`);
    await historyPage.screenshot({ path: historyScreenshot, fullPage: false });
    evidence.screenshots.history = historyScreenshot;
    evidence.checks.push('history_ui_shows_real_results');

    evidence.summaryPath = path.join(artifactsDir, `manual-real-extension-summary-${Date.now()}.json`);
    await writeFile(evidence.summaryPath, JSON.stringify(evidence, null, 2));
    console.log(JSON.stringify(evidence, null, 2));
  } catch (error) {
    evidence.failure = error instanceof Error ? { message: error.message, stack: error.stack } : { message: String(error) };
    if (optionsPage) {
      try {
        evidence.storageAtFailure = redactSecrets(await readAllStorage(optionsPage));
      } catch (storageError) {
        evidence.storageReadError = storageError instanceof Error ? storageError.message : String(storageError);
      }
    }
    if (page) {
      try {
        evidence.panelTextAtFailure = await page.evaluate(() => document.getElementById('zhijuan-prompt-root')?.shadowRoot?.textContent || '');
        const failureScreenshot = path.join(artifactsDir, `manual-real-failure-${Date.now()}.png`);
        await page.screenshot({ path: failureScreenshot, fullPage: false });
        evidence.screenshots.failure = failureScreenshot;
      } catch (screenshotError) {
        evidence.failureScreenshotError = screenshotError instanceof Error ? screenshotError.message : String(screenshotError);
      }
    }
    evidence.summaryPath = path.join(artifactsDir, `manual-real-extension-failure-${Date.now()}.json`);
    await writeFile(evidence.summaryPath, JSON.stringify(evidence, null, 2));
    console.error(JSON.stringify(evidence, null, 2));
    throw error;
  } finally {
    await context.close().catch(() => undefined);
    server.close();
  }
}

run().catch((error) => {
  server.close();
  console.error(error?.stack || error);
  process.exit(1);
});
