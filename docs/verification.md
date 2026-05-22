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
- Automated command-line unpacked load: not observable in this local Chrome 148 profile; the same `--load-extension` check also failed to expose a trivial test extension, so this is recorded as environment-limited rather than a manifest validation failure.

## BridgeDeck

- Base URL: `http://127.0.0.1:8876/accounts/7e517757-60eb-4e9d-8e3a-1ad7d6731dea/v1`
- API key: `dummy`
- Model: `gpt-5.5`
- Vision request: pass
- Schema parse through `analyzeImageWithApi`: pass

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

- Manual Chrome `Load unpacked` still needs a human browser check because this machine's Chrome command-line extension load path did not expose unpacked extensions through CDP.
