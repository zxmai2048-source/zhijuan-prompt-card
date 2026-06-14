# Security

Zhijuan Prompt Card is a Manifest V3 Chrome extension that calls only the configured OpenAI-compatible endpoint by default.

API keys are stored in `chrome.storage.local`. Do not configure endpoints or keys you do not trust. For private images, use a local adapter such as BridgeDeck.

The extension does not include login, Supabase, Firebase, Stripe, WeChat, Google identity, telemetry, analytics, or payment code.

## Security Rules

- Do not commit API keys.
- Do not commit private endpoints.
- Do not commit account UUID paths.
- Do not commit `dist` builds containing sensitive config.
- Any new external request must be documented.
- Any network behavior change must include privacy impact in the PR.
- Extension calls only user-configured endpoints by default.
- No login / payment / telemetry / analytics code.

## Reporting

Report security issues through GitHub private security advisory if available. If private advisory is unavailable, open a minimal issue that does not include sensitive details and ask for a maintainer contact path.
