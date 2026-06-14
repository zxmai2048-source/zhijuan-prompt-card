# Zhijuan Prompt Card Implementation Plan

> **For Codex:** Build this project from scratch in this folder. Git-initialize the project, implement task-by-task, commit frequently, and stop only after the local Chrome extension works end-to-end with BridgeDeck.

**Goal:** Build a polished local-first Chrome extension that recreates and improves `PromptCard - Image to Prompt AI`: right-click or capture an image, reverse it into high-quality image-generation prompts, and copy/open the result in generator tools.

**Architecture:** Chrome Manifest V3 extension. A service worker owns context menus, image preparation, API calls, history, and settings. A content script owns the floating image analysis panel, screenshot selection overlay, and generator-site autofill. Popup/options provide settings and history. All model calls go to the user's configured OpenAI-compatible API; default is local BridgeDeck.

**Tech Stack:** TypeScript, Vite, React, Chrome Extension MV3, CSS modules or plain CSS. No backend. No login. No cloud. No analytics. No payment. No Supabase.

---

## Non-negotiable product target

Recreate the experience and visual quality of the reference plugin, but make it cleaner:

- Dark premium UI, orange accent, compact cards, pill style tags.
- Right-click any image → analyze.
- Page capture / region selection → analyze.
- Floating overlay panel with loading states and results.
- Settings card for Base URL / API Key / Model.
- Local history.
- Copy prompt / copy JSON / copy negative prompt.
- Copy and open generator site: Jimeng, Gemini, Midjourney, Lovart.
- No login, no credits, no cloud dependency.
- Must work with local BridgeDeck GPT model.

Default config:

```text
Base URL: http://127.0.0.1:8876/v1
API Key: local-bridge
Model: gpt-5.5
```

Reference files already provided:

```text
references/promptcard_reverse_prompt_system.txt
references/original_feature_notes.md
references/original_manifest.json
```

Important: Do not copy the original extension code. Use the references to understand behavior and write a fresh implementation.

---

## Required output JSON schema

The model must return JSON shaped like this. Validate and repair if needed.

```ts
export interface PromptAnalysis {
  zh: { prompt: string; analysis: string };
  en: { prompt: string; analysis: string };
  ja: { prompt: string; analysis: string };
  zh_style_tags: string[];
  en_style_tags: string[];
  ja_style_tags: string[];
  json_prompt: {
    subject: string;
    action_pose: string;
    details_appearance: string;
    environment_background: string;
    lighting_atmosphere: string;
    composition_framing: string;
    style_camera: string;
    colors: string[];
    materials: string[];
    aspect_ratio: string;
    quality_modifiers: string[];
    likely_generation_intent: string;
  };
  recreation_prompt: string;
  prompt_core: string;
  negative_prompt: string;
}
```

---

## BridgeDeck API contract

Implement OpenAI-compatible chat completions:

```ts
POST `${normalizeBaseUrl(baseUrl)}/chat/completions`
Authorization: `Bearer ${apiKey}`
Content-Type: application/json

{
  model,
  temperature: 0.18,
  max_tokens: 8192,
  messages: [
    {
      role: 'user',
      content: [
        { type: 'text', text: reversePromptSystemText },
        { type: 'image_url', image_url: { url: `data:${mime};base64,${base64}` } }
      ]
    }
  ]
}
```

`normalizeBaseUrl` rules:

- Trim trailing slash.
- If it already ends with `/chat/completions`, use as-is.
- Otherwise append `/chat/completions`.
- If user enters `/v1`, final URL becomes `/v1/chat/completions`.

Tested good BridgeDeck default:

```text
http://127.0.0.1:8876/v1/chat/completions
```

---

## Git requirement

First action:

```bash
git init
git checkout -b main
```

Commit after each task. Use conventional commits.

---

## Task 1: Initialize extension project

**Objective:** Create a clean MV3 TypeScript extension scaffold.

**Files:**

- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `src/manifest.ts`
- Create: `src/background/index.ts`
- Create: `src/content/index.tsx`
- Create: `src/popup/App.tsx`
- Create: `src/options/App.tsx`
- Create: `src/shared/types.ts`
- Create: `src/shared/defaults.ts`
- Create: `public/icons/` placeholder icons

**Implementation notes:**

Use Vite multi-entry build or a simple extension build setup. Output must be loadable via Chrome `Load unpacked` from `dist/`.

Minimal `package.json` scripts:

```json
{
  "scripts": {
    "dev": "vite build --watch",
    "build": "vite build",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@vitejs/plugin-react": "latest",
    "vite": "latest",
    "typescript": "latest",
    "react": "latest",
    "react-dom": "latest"
  },
  "devDependencies": {}
}
```

**Verification:**

```bash
npm install
npm run typecheck
npm run build
```

Expected: build produces `dist/manifest.json`, background script, content script, popup, options.

**Commit:**

```bash
git add .
git commit -m "chore: initialize local prompt card extension"
```

---

## Task 2: Manifest with minimum permissions

**Objective:** Define a minimal MV3 manifest.

**Files:**

- Modify: `src/manifest.ts`

**Manifest requirements:**

```json
{
  "manifest_version": 3,
  "name": "Zhijuan Prompt Card",
  "description": "Local-first image to prompt reverse prompt tool.",
  "version": "0.1.0",
  "permissions": ["contextMenus", "storage", "scripting", "activeTab", "clipboardWrite"],
  "host_permissions": ["http://127.0.0.1/*", "http://localhost/*", "https://*/*", "http://*/*"],
  "background": { "service_worker": "background.js", "type": "module" },
  "action": { "default_title": "Zhijuan Prompt Card", "default_popup": "popup.html" },
  "options_page": "options.html",
  "content_scripts": [{ "matches": ["http://*/*", "https://*/*"], "js": ["content.js"], "run_at": "document_idle", "all_frames": false }]
}
```

Do not add `identity`.

**Verification:** Load unpacked in Chrome without permission errors.

**Commit:**

```bash
git add src/manifest.ts
 git commit -m "chore: add minimal extension manifest"
```

---

## Task 3: Shared settings and storage

**Objective:** Implement settings/history storage helpers.

**Files:**

- Create: `src/shared/storage.ts`
- Modify: `src/shared/types.ts`
- Modify: `src/shared/defaults.ts`

**Required types:**

```ts
export interface AppSettings {
  enabled: boolean;
  baseUrl: string;
  apiKey: string;
  model: string;
  interfaceLanguage: 'zh' | 'en' | 'ja';
  defaultGeneratorSite: 'jimeng' | 'gemini' | 'midjourney' | 'lovart';
}

export interface HistoryEntry {
  id: string;
  createdAt: string;
  imageUrl?: string;
  pageUrl?: string;
  title: string;
  favorite: boolean;
  analysis?: PromptAnalysis;
  status: 'success' | 'failed' | 'running';
  error?: string;
}
```

History limit: 120 entries.

**Verification:** Add unit-like script or simple dev check that `getSettings()` returns defaults on empty storage.

**Commit:**

```bash
git add src/shared
 git commit -m "feat: add local settings and history storage"
```

---

## Task 4: Reverse prompt instruction loader

**Objective:** Include and use the extracted reverse-prompt system instruction.

**Files:**

- Create: `src/shared/reversePrompt.ts`
- Read source: `references/promptcard_reverse_prompt_system.txt`

**Implementation:**

Embed the content as a string export:

```ts
export const REVERSE_PROMPT_SYSTEM = `...`;
```

Keep the instruction readable. Do not minify manually.

**Verification:** Typecheck passes and string length is > 5000 chars.

**Commit:**

```bash
git add src/shared/reversePrompt.ts
 git commit -m "feat: add reverse prompt instruction"
```

---

## Task 5: API client

**Objective:** Implement OpenAI-compatible vision request and robust JSON extraction.

**Files:**

- Create: `src/shared/apiClient.ts`
- Create: `src/shared/jsonRepair.ts`

**Functions:**

```ts
export function normalizeChatCompletionsUrl(baseUrl: string): string;
export async function analyzeImageWithApi(input: {
  settings: AppSettings;
  imageDataUrl: string;
  promptText: string;
}): Promise<PromptAnalysis>;
```

**JSON extraction:**

- Accept raw JSON.
- Accept fenced ```json blocks.
- If response has extra text, slice from first `{` to last `}`.
- Validate required keys.
- If missing optional arrays, default to `[]`.
- Throw useful error if invalid.

**Verification:** Create a small script or test for `normalizeChatCompletionsUrl`:

```text
https://api.openai.com/v1 -> https://api.openai.com/v1/chat/completions
http://x/chat/completions -> http://x/chat/completions
```

**Commit:**

```bash
git add src/shared/apiClient.ts src/shared/jsonRepair.ts
 git commit -m "feat: add openai compatible vision api client"
```

---

## Task 6: Background service worker

**Objective:** Add context menu, message routing, analysis pipeline.

**Files:**

- Modify: `src/background/index.ts`

**Message types:**

```ts
type RuntimeMessage =
  | { type: 'RUN_ANALYSIS'; payload: { target: ImageTarget } }
  | { type: 'OPEN_PANEL'; payload: { srcUrl?: string; pageUrl?: string } }
  | { type: 'CAPTURE_VISIBLE_TAB' }
  | { type: 'OPEN_GENERATOR_SITE'; payload: { siteId: GeneratorSite; prompt: string } }
  | { type: 'TEST_CONNECTION'; payload: AppSettings };
```

**Context menu:**

- id: `zhijuan-analyze-image`
- title: `Analyze image with Zhijuan Prompt Card`
- contexts: `image`, `page`

**Pipeline:**

1. Receive image URL or data URL.
2. Convert to data URL/base64.
3. Resize/compress if necessary.
4. Call API client.
5. Save to history.
6. Send result to content panel.

**Verification:** Context menu appears after extension reload.

**Commit:**

```bash
git add src/background/index.ts
 git commit -m "feat: add background analysis pipeline"
```

---

## Task 7: Image preparation

**Objective:** Prepare image data URL safely for model input.

**Files:**

- Create: `src/shared/imageData.ts`

**Functions:**

```ts
export async function urlToDataUrl(url: string): Promise<string>;
export async function resizeDataUrl(input: string, maxSide?: number, quality?: number): Promise<string>;
export function dataUrlToMimeAndBase64(dataUrl: string): { mime: string; base64: string };
```

Rules:

- Support jpeg/png/webp input if browser can decode it.
- Output jpeg or png data URL.
- Max side default: 2200 px.
- JPEG quality: 0.9.
- Handle CORS failures by falling back to content-side canvas or screenshot capture.

**Verification:** Analyze a normal web image and a screenshot crop.

**Commit:**

```bash
git add src/shared/imageData.ts
 git commit -m "feat: add image data preparation"
```

---

## Task 8: Floating panel UI

**Objective:** Build polished result panel injected into pages.

**Files:**

- Modify: `src/content/index.tsx`
- Create: `src/content/panel.tsx`
- Create: `src/content/panel.css`

**UI requirements:**

- Fixed panel, right side or centered, draggable optional.
- Dark background: near `#08090d`.
- Cards: `#11131a` / `#161923`.
- Accent: orange `#ff6f12`.
- Loading steps:
  - `Reading the image`
  - `Extracting visual style`
  - `Building your prompt`
- Tabs/buttons:
  - EN
  - 中文
  - JSON
  - Negative
- Buttons:
  - Copy
  - Copy JSON
  - Save
  - Regenerate
  - Open in Jimeng/Gemini/Midjourney/Lovart

**Verification:** Panel opens and closes on any page. Loading state looks good. Error state is readable.

**Commit:**

```bash
git add src/content
 git commit -m "feat: add polished floating analysis panel"
```

---

## Task 9: Screenshot selection overlay

**Objective:** Allow page area selection and analysis.

**Files:**

- Create: `src/content/selectionOverlay.ts`
- Modify: `src/content/index.tsx`
- Modify: `src/background/index.ts`

**Behavior:**

1. User chooses page capture action from popup or context menu.
2. Content script displays full-page dark overlay.
3. User drags a rectangle.
4. Background calls `chrome.tabs.captureVisibleTab`.
5. Content script crops selected rectangle from screenshot.
6. Analyze cropped image.

**Visual:** Orange border, dimmed outside selection, clear cancel on Escape.

**Verification:** Crop a visible page region and analyze it.

**Commit:**

```bash
git add src/content src/background
 git commit -m "feat: add screenshot region analysis"
```

---

## Task 10: Popup and settings

**Objective:** Provide fast access, settings, test connection, and history.

**Files:**

- Modify: `src/popup/App.tsx`
- Create: `src/popup/popup.css`
- Modify: `src/options/App.tsx`

**Popup sections:**

- Header: Zhijuan Prompt Card.
- Status: Local API / model.
- Quick actions:
  - Analyze current page screenshot
  - Open history
  - Open settings
- Settings form:
  - Base URL
  - API Key
  - Model
  - Save and test

**Test connection:** Use a tiny generated red PNG data URL and expect a valid JSON response. If model returns non-schema text, show: `Model sees image but schema failed`.

**Verification:** User can configure BridgeDeck without login.

**Commit:**

```bash
git add src/popup src/options
 git commit -m "feat: add popup settings and connection test"
```

---

## Task 11: History UI

**Objective:** Let user review, copy, favorite, and delete analyses.

**Files:**

- Create: `src/popup/HistoryView.tsx`
- Modify: `src/shared/storage.ts`

**Behavior:**

- Show last 120 entries.
- Title from `json_prompt.subject` or `en.prompt.slice(0, 72)`.
- Copy recreation prompt.
- Copy JSON.
- Delete single entry.
- Clear all.

**Verification:** Analyze 2 images, reload extension, history remains.

**Commit:**

```bash
git add src/popup src/shared/storage.ts
 git commit -m "feat: add local prompt history"
```

---

## Task 12: Generator integration

**Objective:** Copy/open prompt into target generator sites.

**Files:**

- Create: `src/shared/generators.ts`
- Modify: `src/background/index.ts`
- Modify: `src/content/index.tsx`

**Sites:**

Use selectors from `references/original_feature_notes.md`.

MVP behavior:

1. Copy prompt to clipboard.
2. Open target site in new tab.
3. Try to fill prompt selector after page load.
4. If autofill fails, show toast: `Prompt copied. Paste manually.`

Do not auto-submit by default.

**Verification:** Test at least Gemini and one other site if logged in; otherwise verify clipboard + open behavior.

**Commit:**

```bash
git add src/shared/generators.ts src/background src/content
 git commit -m "feat: add generator copy and open workflow"
```

---

## Task 13: Visual polish pass

**Objective:** Make it feel like a premium plugin, not a demo.

**Files:**

- Modify: all CSS files.
- Add: `docs/design-notes.md`

**Design requirements:**

- Strong first impression.
- Compact but readable panel.
- Soft border and shadow.
- Orange highlight only for primary action.
- Smooth loading microcopy.
- Tags look like pills.
- Buttons have hover and active states.
- No default browser form ugliness.

**Verification:** Take screenshots of popup, settings, loading panel, result panel, history. Save under `docs/screenshots/`.

**Commit:**

```bash
git add .
 git commit -m "style: polish premium extension interface"
```

---

## Task 14: Privacy and permissions audit

**Objective:** Ensure the fork is local-first and safe.

**Files:**

- Create: `PRIVACY.md`
- Create: `SECURITY.md`
- Modify: `README.md`

**Required statements:**

- No login.
- No built-in cloud service.
- No telemetry.
- Images are sent only to the configured API endpoint.
- API key is stored in `chrome.storage.local`.
- User should use local BridgeDeck for private workflows.

**Verification:** Search code for forbidden strings:

```bash
grep -R "supabase\|stripe\|wechat\|analytics\|google sign\|identity" -n src public package.json || true
```

Expected: no runtime integrations.

**Commit:**

```bash
git add README.md PRIVACY.md SECURITY.md
 git commit -m "docs: document local privacy model"
```

---

## Task 15: End-to-end verification with BridgeDeck

**Objective:** Prove the project works locally.

**Steps:**

1. Run build.

```bash
npm run typecheck
npm run build
```

2. Load `dist/` in Chrome.
3. Configure:

```text
Base URL: http://127.0.0.1:8876/v1
API Key: local-bridge
Model: gpt-5.5
```

4. Test connection.
5. Analyze a real webpage image.
6. Analyze a screenshot crop.
7. Copy English recreation prompt.
8. Open generator site.
9. Confirm history persists.

**Required final evidence in `docs/verification.md`:**

- Build status.
- Typecheck status.
- Chrome load status.
- BridgeDeck test status.
- At least one example output JSON, redacted if needed.
- Screenshots list.
- Known issues.

**Commit:**

```bash
git add docs/verification.md docs/screenshots
 git commit -m "test: verify bridge deck image prompt workflow"
```

---

## Forbidden actions

- Do not install uTools.
- Do not depend on PromptCard cloud.
- Do not add login.
- Do not add Supabase/Firebase/Stripe/WeChat/payment code.
- Do not submit to Chrome Web Store.
- Do not push to remote unless explicitly asked.
- Do not exfiltrate API keys.
- Do not send images anywhere except the configured Base URL.

---

## Definition of done

Project is complete only when all are true:

- Git repo initialized with meaningful commits.
- `npm run typecheck` passes.
- `npm run build` passes.
- `dist/` loads as an unpacked Chrome extension.
- Right-click image analysis works.
- Screenshot region analysis works.
- BridgeDeck `gpt-5.5` works with image input.
- Output panel displays Chinese, English, JSON, tags, recreation prompt, negative prompt.
- Copy buttons work.
- History persists locally.
- No login/cloud/credits/analytics/payment.
- UI is visually polished and close to or better than the reference plugin.

---

## Suggested README opening

```md
# Zhijuan Prompt Card

Local-first image-to-prompt Chrome extension. Right-click any image or capture a page area, then use your own OpenAI-compatible vision model to reconstruct high-quality prompts for image generation.

Default target: local BridgeDeck `gpt-5.5`.

No login. No credits. No cloud. No telemetry.
```
