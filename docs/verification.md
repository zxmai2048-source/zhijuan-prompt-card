# Verification

## Build

- Typecheck: pass, `npm run typecheck`
- Build: pass, `npm run build`
- Dev checks: pass, `npm run check:storage && npm run check:url`
- Diff whitespace: pass, `git diff --check`
- Permission/privacy grep: pass, no matches for `supabase|stripe|wechat|analytics|google sign|identity` in `src public package.json`

## UI Redesign V2

- `zhijuan-super-image-gen`: pass, accepted run `/Users/jinjungao/work/zhijuan-super-image-gen/imageops/runs/20260523-180424-black-glass-clean-ui-board`
- Design board: pass, `docs/ui-redesign-v2/design-board.html`
- Component detail board: pass, `docs/ui-redesign-v2/component-detail.html`
- Component spec: pass, `docs/ui-redesign-v2/component-spec.md`
- Design review: pass, `docs/ui-redesign-v2/review.md`
- Popup redesign: pass, command puck + bottom utility dock.
- Result panel redesign: pass, result lens with left flow rail, source strip, prompt output, expanded and minimized states.
- Picker overlay redesign: pass, black glass veil, lake-green hover frame, selected stamp.
- Options redesign: pass, drawer-style settings workbench.
- Palette check: pass, old cyan/orange implementation colors removed from `src`.

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
- UI redesign board render: pass, `docs/ui-redesign/component-board.html`
- Content panel redesign harness render: pass, `docs/screenshot-harness.html?mode=result`
- UI v2 design board render: pass, `docs/ui-redesign-v2/design-board.html`
- UI v2 component detail render: pass, `docs/ui-redesign-v2/component-detail.html`
- UI v2 popup render: pass, `dist/popup.html`
- UI v2 options render: pass, `dist/options.html`
- UI v2 expanded panel harness render: pass, `docs/screenshot-harness.html?mode=result`
- UI v2 collapsed panel harness render: pass, `docs/screenshot-harness.html?mode=collapsed`

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
- Screenshot region analysis: pass, selected icon region analyzed through the content-side fallback when Chrome denies non-user-gesture `captureVisibleTab`.
- Capture path: implemented primary `chrome.tabs.captureVisibleTab` path, with DOM-render fallback for non-user-gesture automation or denied capture.

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
- `docs/screenshots/ui-redesign-board.png`
- `docs/screenshots/ui-redesign-panel-harness.png`
- `docs/screenshots/ui-redesign-v2-board.png`
- `docs/screenshots/ui-redesign-v2-components.png`
- `docs/screenshots/ui-redesign-v2-popup.png`
- `docs/screenshots/ui-redesign-v2-panel.png`
- `docs/screenshots/ui-redesign-v2-collapsed.png`
- `docs/screenshots/ui-redesign-v2-options.png`

## Known Issues

- Chrome does not auto-refresh unpacked extensions after rebuild. Use the refresh icon on `chrome://extensions`.
