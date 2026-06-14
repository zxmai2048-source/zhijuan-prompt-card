# ImageGen Prompts

这些提示词用于生成 README、GitHub Social Preview、商店宣传图和 onboarding 概念图。

原则：

- 每张图生成 4 个候选。
- 选择最克制、最不花哨的一张。
- 不追求复杂，追求高级和可信。
- Hero / Social 可以用生成图。
- 产品证明必须优先使用真实截图。
- 不要让生成图模拟真实品牌 Logo。
- 不要塞过多 UI 小字，否则质量会下降。

## 1. README Hero

目标：生成 README 首屏概念图，用于展示 Zhijuan Prompt Card 的整体气质。

画幅：16:9

构图：深色浏览器窗口、被选中的图片、旁边浮动提示词面板。

风格：克制、专业、local-first 创作工具气质。

必须出现：暗色 UI、暖橙强调、结构化提示词卡片、非品牌抽象图片。

避免：真实公司 Logo、假品牌、卡通、赛博朋克、过度霓虹、大量小字。

最终提示词：

```text
Create a polished editorial hero image for an open-source browser extension called "Zhijuan Prompt Card". Show a dark minimal browser window with a floating prompt panel beside a selected image. The selected image is abstract and non-branded, like a cinematic product photo or fashion editorial reference. The floating panel shows clean structured prompt cards without readable tiny text. Visual feeling: local-first creative tool, privacy-aware, precise, calm, professional. Dark neutral interface, warm orange accent, soft white typography, subtle glass reflection, realistic desktop lighting, high-end software product photography. No logos from real companies, no fake brand names, no clutter, no cartoon style, no cyberpunk, no excessive neon.
```

## 2. GitHub Social Preview

目标：GitHub 仓库分享卡片。

画幅：1200x630

构图：中心暗色浏览器面板，紧凑 prompt card system，保留标题空间。

风格：高级、简洁、GitHub README 可信风格。

必须出现：标题区域、"Zhijuan Prompt Card"、"Local-first image to prompt"。

避免：外部 Logo、卡通插画、过度 AI 符号。

最终提示词：

```text
Design a premium GitHub social preview image for "Zhijuan Prompt Card", an open-source local-first image-to-prompt Chrome extension. Center a minimal dark browser panel and a compact prompt card system. Include a single large title area for "Zhijuan Prompt Card" and a short subtitle "Local-first image to prompt". Use dark graphite background, warm orange accent line, subtle grid, calm editorial software aesthetic. Leave generous negative space. No external logos, no cartoon illustration, no overdesigned AI symbols.
```

## 3. Chrome Web Store Promo

目标：Chrome Web Store / Edge Add-ons 宣传图。

画幅：1280x800

构图：三个清晰步骤：pick image、analyze through user-configured endpoint、copy prompt。

风格：产品文档级、清晰、深色 UI、暖橙强调。

必须出现：浏览器扩展面板、三步流程、少量大字。

避免：假 Logo、重渐变、科幻风、拥挤布局。

最终提示词：

```text
Create a clean promotional image for a Chrome extension that converts selected images into structured prompts. Show three steps visually: pick image, analyze locally through user-configured endpoint, copy prompt. Use a refined dark UI style with warm orange accent, realistic browser extension panel, soft shadows, crisp spacing, and professional product documentation look. Keep text minimal and large. Avoid fake logos, avoid heavy gradients, avoid sci-fi, avoid clutter.
```

## 4. Product Mockup

目标：真实截图不足时使用的产品概念图。

画幅：16:10

构图：浮动面板、选图预览卡、视觉历史 rail。

风格：逼近真实桌面浏览器截图，但不要使用真实 Apple 或 Chrome 品牌。

必须出现：EN、中文、JSON、Negative tabs；recreation prompt 区域；history rail。

避免：小字可读性问题、真实品牌 Logo、夸张 AI 光效。

最终提示词：

```text
Create a realistic product mockup of a browser extension floating panel for an image-to-prompt workflow. The panel contains tabs for EN, 中文, JSON, Negative, and a large recreation prompt section. Beside it is a selected image preview card and a small visual history rail. Dark interface, orange accent, clean spacing, realistic desktop browser screenshot feeling, but no actual Apple or Chrome branding. The UI text should be mostly abstract blocks, not tiny readable text. Professional open-source developer tool aesthetic.
```

## 5. Onboarding Illustration

目标：说明 BYOK / BridgeDeck 配置。

画幅：16:9

构图：browser extension、local storage、user-configured vision API endpoint、optional BridgeDeck adapter、generated prompt output。

风格：技术文档插图，深色背景，细连接线。

必须出现：本地边界、用户配置端点、可选 BridgeDeck adapter、prompt output。

避免：品牌 Logo、拥挤、小字、过度装饰。

最终提示词：

```text
Create a minimal technical illustration explaining a BYOK local-first workflow: browser extension, local storage, user-configured vision API endpoint, optional local BridgeDeck adapter, generated prompt output. Use clean vector-like software documentation style, dark background, warm orange highlights, thin connector lines, simple abstract icons. No brand logos, no clutter, no complex small text.
```
