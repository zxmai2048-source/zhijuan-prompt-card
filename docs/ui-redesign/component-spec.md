# Zhijuan Prompt Card UI Redesign Spec

Source workflow:
- Image planning run: `20260523-175016-zhijuan-prompt-card-ui-redesign`
- Implementation target: real Chrome extension source under `src/`

## Product Rule

The popup is a daily-use command surface, not a settings form. API keys, model URL, and default generator live in the options page. The user flow must be visible from first glance:

1. Open popup.
2. Choose page image or capture region.
3. Keep the floating panel visible while picking.
4. Show selected source preview immediately.
5. Show loading progress in the same panel.
6. Show generated prompt in the same panel with copy and generator handoff actions.

## Component System

### Popup Command Surface

- Width: 340-360px.
- Header: product label, short functional title, current model chip.
- Status strip: API host, connection state, compact Test action.
- Main actions: two large tactile buttons.
  - Primary: `选择网页图片`
  - Secondary: `截取屏幕区域`
- Secondary actions: `历史` and `API 设置`.
- No Base URL/API Key/Model fields in popup.

### Floating Result Panel

- Width: 348-356px desktop, responsive to viewport.
- Draggable header with language, settings, collapse, close.
- Top command row: image pick and region capture.
- Source receipt stays near top:
  - thumbnail
  - source type
  - selected image/page title
  - quality/progress rail
- Result area:
  - language tabs
  - prompt text
  - style tags
  - primary English prompt
  - copy/json/negative/regenerate/save actions
  - generator handoff buttons: ChatGPT, Codex, Jimeng, Gemini, Midjourney, Lovart

### Image Picking State

- Panel remains visible before and during picking.
- Overlay labels hovered image as current target.
- Hover label includes image dimensions.
- After click, the panel switches to `正在识别图片` and shows selected source preview.

### Settings Page

- Full options page only.
- Sections:
  - Endpoint and credentials
  - Model and generator
  - Interface language
  - Privacy and permissions
- Test action stays near endpoint fields.

### History

- List entries with status, generated title, timestamp/source, copy/open actions.
- Empty state tells the user to choose an image first.

## Visual Rules

- Palette: off-black, cold neutral surfaces, cyan accent, muted amber only for warmth.
- No purple AI gradient.
- No dense nested cards.
- Use glass only where it clarifies hierarchy: popup shell, floating panel, selected-source receipt.
- Text must fit in 360px popup without horizontal scroll.
- Button labels must describe the action and destination, not generic feature names.
