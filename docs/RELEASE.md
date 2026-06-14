# Release Checklist

1. Clean install
2. `npm run typecheck`
3. `npm run build`
4. `npm run smoke:history`
5. Inspect `dist/manifest.json`
6. Verify no private defaults in `dist`
7. Zip `dist` contents
8. Create GitHub release
9. Attach zip
10. Optional: submit same zip to Chrome Web Store / Edge Add-ons

## Commands

~~~bash
rm -rf dist
npm install
npm run typecheck
npm run build
npm run smoke:history
~~~

## Secret Scan

~~~bash
git grep -nE "accounts/[0-9a-fA-F-]{36}|sk-[A-Za-z0-9]|Bearer |api[_-]?key|token|secret|password|127\\.0\\.0\\.1:8876/accounts" -- . ':!node_modules' ':!package-lock.json'
~~~

## Zip

~~~bash
cd dist
zip -r ../zhijuan-prompt-card.zip .
cd ..
~~~

If `smoke:history` needs headed Chromium, it can be skipped in CI or no-GUI environments, but it must be run locally before release.
