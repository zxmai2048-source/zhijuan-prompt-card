# Changelog

## 0.3.2

**English**

- Makes the English prompt the primary copy-ready recreation prompt, with length scaling to the image instead of a fixed short cap.
- Removes redundant hidden Japanese and duplicate recreation-prompt outputs from new model responses while keeping Chinese/English prompts, JSON prompt, negative prompt, and style tags.
- Adds plain-language fidelity priorities in JSON output so source-defining softness, texture, compression, clarity, or layout constraints can be preserved without generator-specific parameter syntax.
- Simplifies the result UI so users have one obvious primary prompt to copy, and generator handoff uses `en.prompt`.
- Keeps old history readable when legacy records still contain `recreation_prompt` or Japanese settings.
- Adds real timeline-image verification for organic continuous layouts versus stacked rectangular infographic bands.

**中文**

- 英文 Prompt 作为主要可复制复刻提示词，长度按图片复原需要扩展，不再受固定短词数限制。
- 新模型输出移除冗余的隐藏日语字段和重复复刻提示词字段，同时保留中英文 Prompt、JSON Prompt、反向词和风格标签。
- JSON 输出新增自然语言复原优先级，让原图中的柔焦、质地、压缩感、清晰度或版式约束有表达空间，但不输出生成器专属参数语法。
- 简化结果 UI，避免出现多个看似主提示词的复制目标；生成器跳转统一使用 `en.prompt`。
- 旧历史记录仍可读取，兼容含 `recreation_prompt` 或日语设置的旧数据。
- 增加真实时间线图片验证，覆盖自然连续版式与矩形分栏信息图的差异。

## 0.3.1

**English**

- Improves source-image fidelity so soft focus, haze, film blur, low contrast, depth-of-field, lighting texture, and intentional low-fidelity looks are less likely to be over-cleaned.
- Keeps v0.3.0 recognition, text/layout, UI screenshot, material, camera, and style reconstruction strengths while reducing template-like drift.
- Improves real-person reconstruction fidelity for visible facial structure, skin tone, skin texture, hair, pose, body proportions, and casual photo context.
- Improves consistency between natural prompts and JSON output so important visible facts are less likely to be dropped.
- Better preserves ambiguous material, pattern, and surface details instead of overfitting them into generic categories.
- Keeps language prompt tabs focused on copy-ready prompt text instead of mixing in analysis text.
- Makes quality and negative-prompt guidance more conditional to reduce over-polished, AI-flavored, or generic outputs.
- Fixes OpenAI / BridgeDeck / compatible endpoint request options by using `max_completion_tokens` for GPT-5, o-series, and reasoning models, while keeping `max_tokens` and `temperature` for older compatible models.
- Adds in-extension update notices and upgrade guidance, including GitHub release checks, update-note links, and unpacked-install reload instructions.

**中文**

- 提升原图风格保真，减少朦胧、虚焦、胶片感、低对比、光线质感和刻意低清效果被过度清理的问题。
- 保留 v0.3.0 的识别锚点、文字版式、UI 截图、材质、镜头和风格复刻能力，同时减少模板化漂移。
- 改进真人图片的脸型、肤色、皮肤质感、发型、姿势、身体比例和生活照场景保真。
- 改进普通提示词和 JSON 输出的一致性，减少关键可见信息丢失。
- 更好保留复杂材质、图案和表面关系，减少被误写成通用类别。
- 语言提示词标签页只保留可直接复制使用的提示词，不再混入分析文本。
- 质量和反向词约束改为更动态，减少过度精修、AI 味和泛化输出。
- 修复 OpenAI / BridgeDeck / 兼容端点请求参数：GPT-5、o-series 和 reasoning 模型使用 `max_completion_tokens`，旧兼容模型继续使用 `max_tokens` 与 `temperature`。
- 增加插件内更新提示和升级指引，包括 GitHub Release 检查、更新说明入口和本地加载插件的重新加载说明。

## 0.3.0

**English**

- Improved image-to-prompt reconstruction fidelity for stronger image-to-prompt-to-image consistency.
- Better preserves recognizable subjects, source references, composition, text layout, visual style, material feel, and scene structure when supported by the image.
- Improves poster, UI, screenshot, and design-reference handling, including original visible text and layout relationships.
- Produces clearer, more reusable prompts with better drift control for follow-up image generation.
- Updates bilingual release/update messaging for v0.3.0.

**中文**

- 优化图片反推提示词效果，提高“图片 -> 提示词 -> 图片”的复刻一致性。
- 更好保留图片中的可识别主体、来源参考、构图、文字版式、视觉风格、材质质感和场景结构。
- 改进海报、UI、截图和设计参考图的处理，减少文字、布局和画面关系漂移。
- 输出更清晰、更可复用的提示词，便于继续用于后续图像生成。
- 更新 v0.3.0 的中英文更新说明。

## 0.2.0

- Added Visual History MVP.
- Added local thumbnail previews.
- Added quick history rail in the floating panel.
- Added popup visual history grid.
- Added local storage budget protection for thumbnails.
- Added release packaging scripts.
- Added public privacy, security, contribution, and release docs.
- Removed private account-path defaults from public configuration.
- Documented BridgeDeck as an optional local OpenAI-compatible adapter.
