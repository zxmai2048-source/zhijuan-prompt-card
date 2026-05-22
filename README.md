# Zhijuan Prompt Card

Local-first image-to-prompt Chrome extension. Right-click any image or capture a page area, then use your own OpenAI-compatible vision model to reconstruct high-quality prompts for image generation.

Default target: local BridgeDeck `gpt-5.5`.

No login. No credits. No cloud. No telemetry.

## Features

- Right-click image analysis.
- Screenshot region analysis.
- Floating prompt panel with EN, Chinese, JSON, negative prompt, tags, and recreation prompt.
- Popup settings for Base URL, API key, model, history, and connection test.
- Local history in `chrome.storage.local`, capped at 120 entries.
- Copy prompt, copy JSON, copy negative prompt.
- Copy and open Jimeng, Gemini, Midjourney, or Lovart.

## Local Build

```bash
npm install
npm run typecheck
npm run build
```

Load `dist/` with Chrome `Load unpacked`.

## Default API

```text
Base URL: http://127.0.0.1:8876/accounts/7e517757-60eb-4e9d-8e3a-1ad7d6731dea/v1
API Key: dummy
Model: gpt-5.5
```

Images are sent only to the configured API endpoint. API keys stay in `chrome.storage.local`.
