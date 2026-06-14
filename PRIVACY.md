# Privacy Policy

Zhijuan Prompt Card is a local-first browser extension. It does not operate a bundled cloud service, user account system, telemetry pipeline, analytics service, payment system, or credits system.

## What Data Is Processed

The extension can process the following data after the user triggers an action:

- A webpage image selected through the picker or context menu.
- A page region captured by the browser when the user uses region capture.
- A local image file uploaded by the user.
- The page URL or source URL needed to display context in local history.
- Generated prompts, style tags, JSON prompt data, negative prompts, and prompt history.
- Local thumbnails used by the visual history UI.
- Extension settings: Base URL, API Key, model name, language, and default generator.

## Where Data Goes

Selected images are sent only to the OpenAI-compatible endpoint configured by the user in the extension options page.

The extension does not send selected images, prompts, API keys, history, or thumbnails to a Zhijuan-operated server by default.

If the configured endpoint is remote, the user is responsible for that endpoint's privacy and retention behavior. If the configured endpoint uses plain HTTP or a local bridge, the user is responsible for the local network and machine trust boundary.

## Local Storage

The extension stores the following in `chrome.storage.local`:

- API endpoint settings.
- API key.
- Prompt history.
- Visual thumbnails.
- Interface preferences.
- Default generator preference.

The extension does not copy local image files into a separate folder.

## Permissions

The extension requests:

- `contextMenus` for right-click image analysis.
- `storage` for local settings, history, and thumbnails.
- `scripting` for image picking, floating panels, region capture UI, and generator handoff helpers.
- `clipboardWrite` for copy actions.
- `<all_urls>` so the image picker, context menu flow, and floating panel can work on arbitrary HTTP/HTTPS pages selected by the user.
- `file:///*` for local HTML / local-file workflows when the browser user explicitly enables file access for the unpacked extension.

The extension does not analyze a page until the user triggers an image, upload, or region-capture action.

## No Built-In Tracking

The extension does not include:

- Login.
- Analytics.
- Telemetry.
- Advertising tracking.
- Payment code.
- Built-in Zhijuan cloud forwarding.
- Supabase, Firebase, Google identity, Stripe, or WeChat integrations.

## Removing Local Data

Users can remove extension data by clearing the extension's site data through the browser, removing the extension, or using browser developer tools to clear `chrome.storage.local` for the extension.

## Contact

For privacy or security concerns, use GitHub issues for non-sensitive reports. For sensitive reports, use GitHub private security advisories when available.
