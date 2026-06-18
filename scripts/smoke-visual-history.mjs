import http from 'node:http';
import path from 'node:path';
import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distDir = path.join(rootDir, 'dist');
const tempDistDir = '/tmp/zhijuan-dist-history-smoke';
const artifactsDir = path.join(rootDir, 'tmp/browser-tests');
const userDataDir = path.join(rootDir, 'tmp/pw-visual-history-smoke-profile');
const historyKey = 'zhijuan.history';
const settingsKey = 'zhijuan.settings';
const panelUiKey = 'zhijuan_prompt_panel_ui_v2';

const validThumbs = [
  makeSvgDataUrl('#82b89b', '#22302e', 'A'),
  makeSvgDataUrl('#7aa7d9', '#1d2630', 'B'),
  makeSvgDataUrl('#d9a87a', '#30261d', 'C'),
  makeSvgDataUrl('#d97a9d', '#302027', 'D')
];
const brokenThumb = 'data:image/png;base64,not-a-valid-image';

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
  res.end(`<!doctype html>
    <html>
      <head><title>Zhijuan visual history smoke</title></head>
      <body style="min-height:1800px;font-family:sans-serif">
        <main style="max-width:900px;margin:48px auto;display:grid;gap:24px">
          <h1>Visual history smoke</h1>
          ${validThumbs.map((src, index) => `<img src="${src}" alt="smoke ${index}" style="width:280px;height:180px;object-fit:contain;border:1px solid #ddd" />`).join('')}
        </main>
      </body>
    </html>`);
});

function listen() {
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => resolve(server.address()));
  });
}

async function run() {
  await mkdir(artifactsDir, { recursive: true });
  await rm(userDataDir, { recursive: true, force: true });
  await rm(tempDistDir, { recursive: true, force: true });
  await cp(distDir, tempDistDir, { recursive: true });
  const address = await listen();
  const testUrl = `http://127.0.0.1:${address.port}/`;
  const evidence = { browser: 'playwright-chromium-temp-profile', testUrl, extensionId: null, cases: [], checks: [], screenshots: {} };

  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    viewport: { width: 1440, height: 900 },
    ignoreDefaultArgs: ['--disable-extensions'],
    args: [`--disable-extensions-except=${tempDistDir}`, `--load-extension=${tempDistDir}`, '--no-first-run', '--no-default-browser-check']
  });

  try {
    const worker = context.serviceWorkers()[0] || (await context.waitForEvent('serviceworker', { timeout: 15_000 }));
    const extensionId = new URL(worker.url()).host;
    evidence.extensionId = extensionId;

    for (const count of [14, 35, 100]) {
      const entries = makeHistoryEntries(count, 'initial');
      await seedStorage(worker, entries);
      const page = await context.newPage();
      await page.goto(`${testUrl}?count=${count}`, { waitUntil: 'domcontentloaded' });
      await waitForShadowRoot(page);
      await seedStorage(worker, makeHistoryEntries(count, 'live'));
      await page.waitForTimeout(500);
      await openQuickHistory(page);
      const quick = await readContentHistoryState(page);
      assertEqual(quick.quickCards, Math.min(12, count), `quick cards for ${count}`);
      assertEqual(quick.quickOverlaps, 0, `quick card overlaps for ${count}`);
      assertEqual(quick.quickImageOverflows, 0, `quick image overflows for ${count}: ${JSON.stringify(quick.quickImageOverflowDetails)}`);
      assertIncludes(quick.quickText, count > 12 ? `12 / ${count}` : String(count), `quick count for ${count}`);
      await openFullHistoryFromDrawer(page);
      const full = await readContentHistoryState(page);
      assertEqual(full.fullItems, count, `full content history for ${count}`);
      assertHistoryStatuses(full.fullText, `content full ${count}`);

      const contentScreenshot = path.join(artifactsDir, `pw-visual-history-content-${count}-${Date.now()}.png`);
      await page.screenshot({ path: contentScreenshot, fullPage: false });

      const popup = await context.newPage();
      await popup.goto(`chrome-extension://${extensionId}/popup.html#history`);
      await popup.waitForSelector('.history-item', { timeout: 10_000 });
      await popup.waitForTimeout(700);
      const popupState = await readPopupHistoryState(popup);
      assertEqual(popupState.items, count, `popup history items for ${count}`);
      assertEqual(popupState.visualCards, Math.min(8, count), `popup visual cards for ${count}`);
      assertHistoryStatuses(popupState.text, `popup ${count}`);

      const popupScreenshot = path.join(artifactsDir, `pw-visual-history-popup-${count}-${Date.now()}.png`);
      await popup.screenshot({ path: popupScreenshot, fullPage: true });
      evidence.cases.push({ count, quick, full, popup: popupState, screenshots: { content: contentScreenshot, popup: popupScreenshot } });
      evidence.checks.push(`history_${count}_ok`);
      await popup.close();
      await page.close();
    }

    const runningGuardPage = await context.newPage();
    await seedStorage(worker, makeHistoryEntries(14, 'running-guard'));
    await runningGuardPage.goto(`${testUrl}?running=1`, { waitUntil: 'domcontentloaded' });
    await waitForShadowRoot(runningGuardPage);
    await seedStorage(worker, makeHistoryEntries(14, 'running-guard-live'));
    await runningGuardPage.waitForTimeout(500);
    await sendContentMessage(worker, runningGuardPage.url(), {
      type: 'ANALYSIS_STARTED',
      payload: {
        entry: makeRunningEntry('active-running-guard'),
        target: { kind: 'image', srcUrl: 'https://example.test/running.jpg', pageUrl: runningGuardPage.url(), title: 'Running guard image' }
      }
    });
    await runningGuardPage.waitForFunction(() => {
      const root = document.getElementById('zhijuan-prompt-root')?.shadowRoot;
      const text = (root?.textContent || '').replace(/\s+/g, ' ');
      return text.includes('正在识别图片') && text.includes('等待模型');
    }, null, { timeout: 10_000 });
    const runningGuardState = await readContentHistoryState(runningGuardPage);
    assertEqual(runningGuardState.hasHistoryTab, false, 'history tab hidden while running');
    evidence.checks.push('running_history_guard_ok');
    evidence.runningGuard = runningGuardState;
    await runningGuardPage.close();

    await seedStorage(worker, makeHistoryEntries(14, 'clear'));
    const clearPage = await context.newPage();
    await clearPage.goto(`${testUrl}?clear=1`, { waitUntil: 'domcontentloaded' });
    await waitForShadowRoot(clearPage);
    await seedStorage(worker, makeHistoryEntries(14, 'clear-live'));
    await clearPage.waitForTimeout(500);
    await openQuickHistory(clearPage);
    await openFullHistoryFromDrawer(clearPage);
    await clickShadow(clearPage, { text: '清空历史', exact: true });
    await clearPage.waitForFunction(() => {
      const root = document.getElementById('zhijuan-prompt-root')?.shadowRoot;
      return (root?.querySelectorAll('.zpc-history-item') || []).length === 0 && (root?.textContent || '').includes('暂无本地记录');
    }, null, { timeout: 10_000 });
    const storedAfterClear = await worker.evaluate((key) => chrome.storage.local.get(key).then((record) => record[key] || []), historyKey);
    assertEqual(storedAfterClear.length, 0, 'storage cleared from content');

    const emptyPopup = await context.newPage();
    await emptyPopup.goto(`chrome-extension://${extensionId}/popup.html#history`);
    await emptyPopup.waitForFunction(() => document.body.innerText.includes('暂无历史') || document.querySelectorAll('.history-item').length === 0, null, { timeout: 10_000 });
    const emptyPopupState = await readPopupHistoryState(emptyPopup);
    assertEqual(emptyPopupState.items, 0, 'popup empty after content clear');
    evidence.checks.push('clear_sync_ok');

    evidence.summaryPath = path.join(artifactsDir, `pw-visual-history-summary-${Date.now()}.json`);
    await writeFile(evidence.summaryPath, JSON.stringify(evidence, null, 2));
    console.log(JSON.stringify(evidence, null, 2));
  } finally {
    await context.close().catch(() => undefined);
    server.close();
  }
}

async function seedStorage(worker, entries) {
  await worker.evaluate(
    async ({ historyKey, settingsKey, panelUiKey, entries }) => {
      await chrome.storage.local.set({
        [historyKey]: entries,
        [settingsKey]: {
          enabled: true,
          baseUrl: 'http://127.0.0.1:1/v1',
          apiKey: 'smoke',
          model: 'smoke-model',
          interfaceLanguage: 'zh',
          defaultGeneratorSite: 'chatgpt',
          persistentFloatingButton: true
        },
        [panelUiKey]: { x: 520, y: 80, collapsed: false }
      });
    },
    { historyKey, settingsKey, panelUiKey, entries }
  );
}

async function waitForShadowRoot(page) {
  await page.waitForFunction(() => Boolean(document.getElementById('zhijuan-prompt-root')?.shadowRoot), null, { timeout: 15_000 });
  await page.waitForTimeout(400);
}

async function openQuickHistory(page) {
  await page.evaluate(() => {
    const root = document.getElementById('zhijuan-prompt-root')?.shadowRoot;
    const panel = root?.querySelector('.zpc-panel');
    if (panel?.classList.contains('zpc-panel--collapsed')) {
      root?.querySelector('.zpc-collapsed-handle')?.click();
    }
  });
  await page.waitForFunction(() => {
    const root = document.getElementById('zhijuan-prompt-root')?.shadowRoot;
    return Boolean(root?.querySelector('.zpc-history-tab'));
  }, null, { timeout: 10_000 });
  await page.evaluate(() => {
    const root = document.getElementById('zhijuan-prompt-root')?.shadowRoot;
    const button = root?.querySelector('.zpc-history-tab');
    if (!button) throw new Error('missing quick history tab');
    button.click();
  });
  await page.waitForFunction(() => {
    const root = document.getElementById('zhijuan-prompt-root')?.shadowRoot;
    return (root?.querySelectorAll('.zpc-quick-history-card') || []).length > 0;
  }, null, { timeout: 10_000 });
  await page.waitForTimeout(350);
}

async function openFullHistoryFromDrawer(page) {
  await page.evaluate(() => {
    const root = document.getElementById('zhijuan-prompt-root')?.shadowRoot;
    const button = root?.querySelector('.zpc-quick-history__full');
    if (!button) throw new Error('missing all history button');
    button.click();
  });
  await page.waitForFunction(() => {
    const root = document.getElementById('zhijuan-prompt-root')?.shadowRoot;
    return Boolean(root?.querySelector('.zpc-history-panel'));
  }, null, { timeout: 10_000 });
  await page.waitForTimeout(350);
}

async function clickShadow(page, spec) {
  await page.evaluate((spec) => {
    const root = document.getElementById('zhijuan-prompt-root')?.shadowRoot;
    if (!root) throw new Error('missing shadow root');
    const button = [...root.querySelectorAll('button')].find((item) => {
      const text = (item.textContent || '').replace(/\s+/g, ' ').trim();
      const aria = item.getAttribute('aria-label') || '';
      const title = item.getAttribute('title') || '';
      return spec.exact ? text === spec.text || aria === spec.text || title === spec.text : text.includes(spec.text) || aria.includes(spec.text) || title.includes(spec.text);
    });
    if (!button) throw new Error(`missing shadow button ${JSON.stringify(spec)}`);
    button.click();
  }, spec);
}

async function readContentHistoryState(page) {
  await page.waitForTimeout(500);
  return page.evaluate(() => {
    const root = document.getElementById('zhijuan-prompt-root')?.shadowRoot;
    if (!root) throw new Error('missing shadow root');
    const quickCards = [...root.querySelectorAll('.zpc-quick-history-card')];
    const quickBoxes = quickCards.map((card) => card.getBoundingClientRect());
    const quickOverlaps = quickBoxes.reduce((count, box, index) => {
      if (!index) return count;
      return box.top < quickBoxes[index - 1].bottom - 1 ? count + 1 : count;
    }, 0);
    const quickImageOverflowDetails = [];
    const quickImageOverflows = quickCards.reduce((count, card, index) => {
      const cardBox = card.getBoundingClientRect();
      const thumb = card.querySelector('.zpc-quick-history-thumb');
      const thumbBox = thumb?.getBoundingClientRect();
      const overflow = [...card.querySelectorAll('img')].some((image) => {
        const box = image.getBoundingClientRect();
        const isOverflow = box.width > 0 && box.height > 0 && (box.top < cardBox.top - 1 || box.bottom > cardBox.bottom + 1 || box.left < cardBox.left - 1 || box.right > cardBox.right + 1);
        if (isOverflow && quickImageOverflowDetails.length < 4) {
          const cardStyle = getComputedStyle(card);
          const thumbStyle = thumb ? getComputedStyle(thumb) : undefined;
          const imageStyle = getComputedStyle(image);
          quickImageOverflowDetails.push({
            index,
            card: { top: cardBox.top, bottom: cardBox.bottom, left: cardBox.left, right: cardBox.right, width: cardBox.width, height: cardBox.height },
            thumb: thumbBox ? { top: thumbBox.top, bottom: thumbBox.bottom, left: thumbBox.left, right: thumbBox.right, width: thumbBox.width, height: thumbBox.height } : undefined,
            image: { top: box.top, bottom: box.bottom, left: box.left, right: box.right, width: box.width, height: box.height },
            styles: {
              cardDisplay: cardStyle.display,
              cardHeight: cardStyle.height,
              thumbDisplay: thumbStyle?.display,
              thumbHeight: thumbStyle?.height,
              thumbPosition: thumbStyle?.position,
              imageDisplay: imageStyle.display,
              imagePosition: imageStyle.position,
              imageHeight: imageStyle.height
            }
          });
        }
        return isOverflow;
      });
      return overflow ? count + 1 : count;
    }, 0);
    return {
      quickCards: quickCards.length,
      quickOverlaps,
      quickImageOverflows,
      quickImageOverflowDetails,
      hasHistoryTab: Boolean(root.querySelector('.zpc-history-tab')),
      quickText: (root.querySelector('.zpc-quick-history')?.textContent || '').replace(/\s+/g, ' ').trim(),
      fullItems: root.querySelectorAll('.zpc-history-item').length,
      fullPlaceholders: root.querySelectorAll('.zpc-history-placeholder').length,
      fullImages: root.querySelectorAll('.zpc-history-item__thumb img').length,
      fullText: (root.querySelector('.zpc-history-panel')?.textContent || '').replace(/\s+/g, ' ').trim()
    };
  });
}

async function sendContentMessage(worker, pageUrl, message) {
  await worker.evaluate(
    async ({ pageUrl, message }) => {
      const tabs = await chrome.tabs.query({});
      const baseUrl = pageUrl.split('?')[0];
      const tab = tabs.find((item) => item.url === pageUrl) || tabs.find((item) => item.url?.startsWith(baseUrl)) || tabs.find((item) => item.url && !item.url.startsWith('chrome-extension://'));
      if (!tab?.id) throw new Error(`Unable to find content tab for ${pageUrl}`);
      await chrome.tabs.sendMessage(tab.id, message);
    },
    { pageUrl, message }
  );
}

async function readPopupHistoryState(page) {
  return page.evaluate(() => ({
    items: document.querySelectorAll('.history-item').length,
    visualCards: document.querySelectorAll('.history-visual-card').length,
    placeholders: document.querySelectorAll('.history-item__placeholder, .history-visual-card__placeholder').length,
    images: document.querySelectorAll('.history-item__media img, .history-visual-card__media img').length,
    text: document.body.innerText.replace(/\s+/g, ' ').trim()
  }));
}

function assertHistoryStatuses(text, label) {
  for (const expected of ['成功', '失败', '运行中', '已取消']) {
    assertIncludes(text, expected, `${label} status ${expected}`);
  }
}

function makeHistoryEntries(count, seed = 'default') {
  return Array.from({ length: count }, (_, index) => {
    const variant = index % 6;
    const status = variant === 2 ? 'failed' : variant === 3 ? 'running' : variant === 4 ? 'canceled' : 'success';
    const hasAnalysis = status === 'success';
    const imageUrl = variant === 5 ? undefined : `https://example.test/image-${index}.jpg`;
    const thumbnailUrl = variant === 0 || variant === 4 ? validThumbs[index % validThumbs.length] : variant === 1 ? brokenThumb : undefined;
    return {
      id: `history-${seed}-${count}-${index}`,
      createdAt: new Date(Date.UTC(2026, 5, 12, 8, 0, index)).toISOString(),
      imageUrl,
      thumbnailUrl,
      pageUrl: index % 3 === 0 ? `https://example.test/page-${index}` : undefined,
      title: `视觉历史记录 ${index + 1}`,
      favorite: index % 7 === 0,
      status,
      error: status === 'failed' ? '识别失败：smoke placeholder' : status === 'canceled' ? '已取消识别。' : undefined,
      analysis: hasAnalysis ? makeAnalysis(index) : undefined
    };
  });
}

function makeRunningEntry(id) {
  return {
    id,
    createdAt: new Date(Date.UTC(2026, 5, 12, 8, 30, 0)).toISOString(),
    imageUrl: 'https://example.test/running.jpg',
    thumbnailUrl: validThumbs[0],
    pageUrl: 'https://example.test/running-page',
    title: '运行中保护记录',
    favorite: false,
    status: 'running'
  };
}

function makeAnalysis(index) {
  const prompt = `Smoke prompt ${index + 1}: complete image preview, stable history card, copyable prompt text.`;
  return {
    zh: { prompt: `视觉历史提示词 ${index + 1}，完整图片预览，提示词可复制。`, analysis: 'smoke' },
    en: { prompt, analysis: 'smoke' },
    zh_style_tags: ['历史', '缩略图'],
    en_style_tags: ['history', 'thumbnail'],
    json_prompt: {
      subject: `Visual history smoke ${index + 1}`,
      action_pose: 'static UI record',
      details_appearance: 'thumbnail, status, prompt summary',
      environment_background: 'browser extension panel',
      lighting_atmosphere: 'neutral UI',
      composition_framing: 'image first card',
      style_camera: 'software screenshot',
      colors: ['green', 'charcoal'],
      materials: ['pixels'],
      aspect_ratio: 'mixed',
      quality_modifiers: ['readable', 'stable'],
      fidelity_priorities: ['history card priority 80 of 100 - keep thumbnail and prompt preview readable'],
      likely_generation_intent: 'validation'
    },
    prompt_core: 'visual history smoke',
    negative_prompt: 'broken image wall, cropped strip, missing placeholder'
  };
}

function makeSvgDataUrl(accent, background, label) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="360" height="220" viewBox="0 0 360 220"><rect width="360" height="220" fill="${background}"/><circle cx="85" cy="88" r="54" fill="${accent}" opacity=".9"/><rect x="148" y="58" width="154" height="26" rx="13" fill="#f4fff8" opacity=".9"/><rect x="148" y="102" width="116" height="18" rx="9" fill="#f4fff8" opacity=".58"/><text x="180" y="174" fill="#f4fff8" font-family="Arial" font-size="42" text-anchor="middle">${label}</text></svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

function assertEqual(actual, expected, label) {
  if (actual !== expected) throw new Error(`${label}: expected ${expected}, got ${actual}`);
}

function assertIncludes(value, expected, label) {
  if (!String(value).includes(expected)) throw new Error(`${label}: missing ${expected}`);
}

run().catch((error) => {
  server.close();
  console.error(error?.stack || error);
  process.exit(1);
});
