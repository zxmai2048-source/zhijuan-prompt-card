# Zhijuan Prompt Card V2 Component Spec

Source image-planning run: `20260523-180424-black-glass-clean-ui-board`

Design direction: black frosted glass, matte charcoal, one muted lake-green accent, compact daily-use Chrome extension UI. Keep function, replace old stacked-card structure.

## User Flow

1. Popup opens as a compact command puck.
2. User chooses `选图识别` or `框选`.
3. Page shows an image hover frame or selection frame.
4. Selected image appears immediately in the floating result lens.
5. Prompt output occupies the largest result area.
6. User copies prompt, copies JSON, or opens a generator.
7. Panel can collapse into a small capsule without covering the page.

## Components

### Popup Command Puck

- Center object: circular `图片源` puck.
- Primary action: `选图识别`, positioned on the orbit.
- Secondary action: `框选`, also on the orbit.
- Utility actions: `历史`, `设置`, `测试` in the bottom dock.
- No large custom API form in the daily popup.

### Image Picker Overlay

- Hover state: lake-green outline around the actual page image, with dimensions.
- Selected state: stamped label on the image, then result lens enters loading.
- Escape state: overlay disappears, panel remains usable.

### Result Lens

- Expanded state: left flow rail, source strip, prompt output, actions, generator handoff.
- Minimized state: capsule with status and quality score.
- Drag state: header/puck can move the panel, position persists locally.
- Prompt output is visually dominant.

### Settings Drawer

- Dedicated options page with left section rail.
- API endpoint, API key, model, generator, interface language, and privacy boundary are separated from daily actions.

### History Receipt

- History rows present source title, status, prompt quality, favorite state, and copy actions.
- Empty state explains that results appear after selecting an image.

## Motion Rules

- Animate `transform` and `opacity`, not layout dimensions.
- Hover: translate up 1-2px, border refraction brightens.
- Pressed: translate down 1px and scale to 0.99.
- Loading: orbit/ring pulse, skeleton bars in prompt output.
- Collapse: expanded lens morphs into bottom/right capsule.

## Audit Notes

- Old cyan-orange dominant palette removed.
- Old language/status/action stacked cards removed.
- Selected image and prompt output are always visible together after analysis starts.
- Daily popup reduced to action entry, settings moved to options.
