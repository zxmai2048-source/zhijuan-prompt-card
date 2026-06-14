# PromptCard - Image to Prompt AI 插件逆向要点

目标插件：`PromptCard - Image to Prompt AI`
Chrome Web Store：`https://chromewebstore.google.com/detail/promptcard-image-to-promp/pdiegjclbkenbildadfjggoidpkplbmd`
官网：`https://promptcard.net/`
版本：`1.2.5`

## 可复刻功能

- 右键网页图片：Analyze image with PromptCard。
- 右键页面/浮动面板：可触发当前页面截图/框选区域分析。
- 结果面板：显示中英日 prompt、analysis、style tags、JSON prompt、recreation prompt、negative prompt。
- 设置：Base URL、API Key、Model。
- 本地历史：history，本地保存，约 120 条。
- 一键复制。
- Copy and open generator：打开并尝试填充 Jimeng / Gemini / Midjourney / Lovart。

## 原插件权限

- `contextMenus`
- `storage`
- `scripting`
- `activeTab`
- `identity`
- `clipboardWrite`
- `host_permissions: <all_urls>`

复刻版不要用 `identity`，不要登录，不要 Supabase，不要支付，不要 telemetry。

## 模型调用

原插件 custom API 走 OpenAI-compatible：

```text
POST {baseUrl}/chat/completions
Authorization: Bearer {apiKey}
Content-Type: application/json
```

消息形态：

```json
{
  "model": "...",
  "temperature": 0.18,
  "max_tokens": 8192,
  "messages": [
    {
      "role": "user",
      "content": [
        {"type": "text", "text": "<system/user reverse prompt instruction>"},
        {"type": "image_url", "image_url": {"url": "data:image/png;base64,..."}}
      ]
    }
  ]
}
```

原插件会自动把 baseUrl 末尾补成 `/chat/completions`。

## 本机 BridgeDeck 验证结果

已验证 BridgeDeck 支持 vision：

```text
Base URL: http://127.0.0.1:8876/v1
Model: gpt-5.5
API Key: local-bridge
Result: image_url 输入可用，红色测试图返回 Red。
```

## 目标生成器站点

原插件包含以下站点填充逻辑：

- Jimeng: `https://jimeng.jianying.com/`
  - prompt selectors: `textarea`, `div[contenteditable='true']`, `input[type='text']`
  - send selectors: `button[type='submit']`, `.semi-button-primary`, `.byted-btn-primary`, `button[data-testid*='send']`
- Gemini: `https://gemini.google.com/app`
  - prompt selectors: `rich-textarea .ql-editor`, `div[contenteditable='true'][role='textbox']`, `textarea`
- Midjourney: `https://www.midjourney.com/imagine`
  - prompt selectors: `textarea`, `div[contenteditable='true']`, `input[type='text']`
- Lovart: `https://www.lovart.ai/`
  - prompt selectors: `textarea`, `div[contenteditable='true']`, `input[type='text']`
  - upload selectors: image/file/attach buttons and file inputs

MVP 先做 copy + open，不强求自动 submit。

## 视觉/交互参考

- 黑色/深灰背景。
- 橙色强调色。
- 卡片式结果面板。
- 小 pill 标签。
- 分阶段 loading 文案：
  - Reading the image / 正在读取图片
  - Extracting visual style / 正在提取视觉风格
  - Building your prompt / 正在生成提示词
- 设置卡片文案：
  - Fill in Base URL, API key, and model once. After saving, analysis will continue for the current image.

## 必须优于原插件

- 无登录。
- 无云端。
- 无 credits。
- 不请求 Google identity。
- 默认本机 BridgeDeck。
- 权限最小化。
- 清楚标明图片只发给用户配置的 API。
