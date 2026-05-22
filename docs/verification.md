# Verification

## Build

- Typecheck: pass, `npm run typecheck`
- Build: pass, `npm run build`
- Dev checks: pass, `npm run check:storage && npm run check:url`
- Permission/privacy grep: pass, no matches for `supabase|stripe|wechat|analytics|google sign|identity` in `src public package.json`

## Chrome Load

- `dist/manifest.json`: present
- `dist/popup.html`: present
- `dist/options.html`: present
- `dist/background.js`: present
- `dist/content.js`: present
- Chrome package validation: pass, `Google Chrome --pack-extension="$(pwd)/dist"`
- Chrome for Testing unpacked load: pass, extension state `ENABLED`, location `UNPACKED`, no manifest errors.
- Popup as extension page: pass, default BridgeDeck settings visible.
- Content script injection on local HTTP page: pass.

## BridgeDeck

- Base URL: `http://127.0.0.1:8876/accounts/7e517757-60eb-4e9d-8e3a-1ad7d6731dea/v1`
- API key: `dummy`
- Model: `gpt-5.5`
- Vision request: pass
- Schema parse through `analyzeImageWithApi`: pass
- Extension-triggered image analysis through BridgeDeck: pass.
- Floating panel result render: pass, English prompt/recreation/negative controls visible.
- Copy button: pass, `Prompt copied` notice shown.
- Generator open: pass, Gemini tab opened.
- History after image analysis: pass, one successful local entry.
- Screenshot selection overlay: pass, full-viewport overlay and drag selection render correctly.
- Screenshot capture automation note: non-user-gesture automation cannot grant Chrome `activeTab`, so `captureVisibleTab` is manually gated by Chrome. The UI now shows a readable permission error for that path. Real popup/context-menu user gestures are expected to grant `activeTab`.

## Example Output JSON

```json
{
  "subject": "One large saturated orange circular disk, abstract sun-like form, centered in a simple geometric landscape.",
  "colors": ["deep black-navy", "vivid orange", "warm off-white"],
  "en_style_tags": ["minimal geometry", "flat vector", "abstract sunset", "high contrast"],
  "recreation_prompt_sample": "A clean minimalist flat vector illustration of an abstract sunset icon: a single vivid orange circular disk centered horizontally in the upper middle of a solid deep black-navy canvas..."
}
```

## Screenshots

- `docs/screenshots/popup.png`
- `docs/screenshots/settings.png`
- `docs/screenshots/history.png`
- `docs/screenshots/loading-panel.png`
- `docs/screenshots/result-panel.png`
- `docs/screenshots/chrome-load.json`

## Known Issues

- Automated screenshot-capture E2E cannot fully prove `chrome.tabs.captureVisibleTab` without a real extension user gesture; Chrome rejects programmatic non-user-gesture capture with `Either the '<all_urls>' or 'activeTab' permission is required.`
