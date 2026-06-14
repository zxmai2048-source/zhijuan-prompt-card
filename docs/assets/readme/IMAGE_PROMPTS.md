# README ImageGen Brief

本文件记录 README 配图的 ImageGen 生成要求、参考图和约束。

## Reference Standard / 参考标准

Curated draft ad assets were used only as visual quality references. They are not included in this repository and are not product screenshots.

当前真实插件 UI 和功能参考来自仓库内截图：

- `docs/assets/readme/quick-history.png`
- `docs/assets/readme/popup-history.png`
- `docs/assets/readme/floating-panel.png`
- `docs/assets/readme/options.png`
- `docs/assets/readme/popup.png`

## Shared Direction / 共用方向

- 深色哑光石墨背景。
- 黑色磨砂玻璃 UI。
- 克制的低饱和湖绿色 / mint-green 点缀。
- 产品截图是功能依据，但生成图可以重新设计版式。
- 不要过度约束构图，给 ImageGen 设计空间。
- README 图片是 product graphic，不是假装真实截图。

## Must Communicate / 必须表达

- 本地优先 local-first。
- BYOK / user-configured endpoint。
- 上传图片、右键网页图片、框选页面区域。
- 中文 / 英文 / JSON / Recreation / Negative Prompt。
- Visual History、local thumbnails、quick history。
- 无登录、无 credits、无 telemetry。

## Avoid / 禁止

- 不要具体 URL。
- 不要 `/accounts` path。
- 不要 API key 值。
- 不要 model alias 值。
- 不要 license 文案。
- 不要官方平台 logo。
- 不要把图做成旧版功能。
- 不要 orange SVG 风格。
- 不要 cyberpunk、霓虹、假 AI dashboard。
- 不要密集小字，避免生成错字。

## Generated Assets / 已生成资产

- `docs/assets/readme/imagegen/readme-banner.png` - Direct ImageGen output with Chinese / English text.
- `docs/assets/readme/imagegen/readme-workflow.png` - Direct ImageGen output with Chinese / English text.
- `docs/assets/readme/imagegen/readme-local-first.png` - Direct ImageGen output with Chinese / English text.

Final README images are direct ImageGen outputs. Text is requested inside the ImageGen prompt; no local text overlay is used.

## Prompt 0: README Banner

```text
Create a polished README hero banner for the Chrome extension "Zhijuan Prompt Card". Use the user-provided banner reference for composition, the real plugin UI screenshots for product truth, and the curated old ads only as visual quality/style reference.

Composition: left brand/title block, large angled browser window in the center, selected image crop rectangle, floating prompt output panel on the right, thumbnail visual history strip, and a small bottom workflow row. Dark frosted-glass software UI, matte graphite background, restrained mint-green accents.

Text must be rendered directly by ImageGen. Use only these exact visible bilingual strings:
"Zhijuan Prompt Card"
"Local-first image to prompt"
"本地优先 · 图片反推 Prompt"
"BYOK / Your API"
"Local History / 本地历史"
"No telemetry / 无遥测"
"Structured Output / 结构化输出"
"Select Image / 选图"
"Your Vision Endpoint / 你的视觉端点"
"Structured Prompts / 结构化 Prompt"
"Copy & Create / 复制并创作"

Product truth: local-first does not mean offline-only. Selected images go only to the user's configured OpenAI-compatible vision endpoint. Local thumbnails and prompt history stay in browser local storage. Outputs include Chinese Prompt, English Prompt, Japanese Prompt, JSON Prompt, Recreation Prompt, Negative Prompt, and Style Tags.

Avoid fake URLs, account paths, API keys, model values, license text, official platform logos, extra invented words, orange old SVG style, cyberpunk neon, and dense tiny paragraphs.
```

## Prompt 1: Workflow

```text
Create a polished workflow visual for the Chrome extension "Zhijuan Prompt Card". Use the real plugin UI screenshots for product truth and curated old ads as visual quality reference.

Composition: three clear stages from left to right with real-feeling dark UI panels and gentle arrows: image input, prompt deconstruction, prompt reuse. Include a central browser/extension prompt panel and a right-side visual history/output grid. Dark frosted-glass software UI, matte graphite background, restrained mint-green accents.

Text must be rendered directly by ImageGen. Use only these exact visible bilingual strings:
"Workflow / 工作流"
"Image -> Prompt / 图片 -> Prompt"
"1 Select / 选图"
"Upload, right-click, or crop / 上传、右键或框选"
"2 Deconstruct / 反推"
"Structured prompts / 结构化 Prompt"
"3 Reuse / 复用"
"Copy & create / 复制并创作"
"CN / 中文"
"EN / 英文"
"JP / 日文"
"JSON / 结构化"
"Recreate / 重绘"
"Negative / 负面词"
"History / 历史"

Product truth: users can upload local images, right-click webpage images, or crop page regions. The selected image is sent to the user's configured OpenAI-compatible vision endpoint. Outputs include Chinese Prompt, English Prompt, Japanese Prompt, JSON Prompt, Recreation Prompt, Negative Prompt, and Style Tags. Visual history is local.

Avoid fake URLs, account paths, API keys, model values, license text, official platform logos, extra invented words, orange old SVG style, cyberpunk neon, and dense tiny paragraphs.
```

## Prompt 2: Local-First Privacy

```text
Create a polished local-first privacy boundary visual for the Chrome extension "Zhijuan Prompt Card". Use the real plugin UI screenshots for product truth and curated old ads as visual quality reference.

Composition: clean trust diagram with three visual zones: Extension, Your API, Local History. Show a selected image flowing from the extension to the user's configured vision endpoint and prompt output returning, while thumbnails/history remain local. Use UI-like panels and arrows. Dark frosted-glass software UI, matte graphite background, restrained mint-green accents.

Text must be rendered directly by ImageGen. Use only these exact visible bilingual strings:
"Local First / 本地优先"
"BYOK privacy boundary / BYOK 隐私边界"
"Extension / 扩展"
"Upload, right-click, crop / 上传、右键、框选"
"Your API / 你的 API"
"Only your endpoint / 仅你的端点"
"Local History / 本地历史"
"Thumbnails stay local / 缩略图留在本机"
"No login / 无登录"
"No credits / 无 credits"
"No telemetry / 无遥测"
"No analytics / 无 analytics"

Product truth: the extension is local-first but not offline-only. Selected images are sent only to the endpoint configured by the user. API keys, prompt history, and visual thumbnails are stored locally in chrome.storage.local. The extension does not bundle a Zhijuan cloud service by default.

Avoid fake URLs, account paths, API keys, model values, license text, official platform logos, extra invented words, "works offline" claim, "all local" claim, orange old SVG style, cyberpunk neon, and dense tiny paragraphs.
```
