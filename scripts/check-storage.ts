import { strict as assert } from 'node:assert';
import { DEFAULT_SETTINGS } from '../src/shared/defaults';
import { getHistoryPrompt } from '../src/shared/historyDisplay';
import { addHistoryEntry, buildHistoryTitle, clearHistory, compactHistoryStorage, createRunningHistoryEntry, getHistory, getSettings, saveSettings, updateHistoryEntry } from '../src/shared/storage';

const settings = await getSettings();
assert.equal(settings.baseUrl, DEFAULT_SETTINGS.baseUrl);
assert.equal(settings.apiKey, DEFAULT_SETTINGS.apiKey);
assert.equal(settings.model, DEFAULT_SETTINGS.model);
assert.equal(settings.interfaceLanguage, DEFAULT_SETTINGS.interfaceLanguage);

const normalizedLegacySettings = await saveSettings({ interfaceLanguage: 'ja' as never });
assert.equal(normalizedLegacySettings.interfaceLanguage, 'en');
await saveSettings({ interfaceLanguage: DEFAULT_SETTINGS.interfaceLanguage });

const legacyAnalysis = {
  zh: { prompt: '新版中文短提示', analysis: '' },
  en: { prompt: 'new shorter English prompt', analysis: '' },
  zh_style_tags: [],
  en_style_tags: [],
  json_prompt: {
    subject: '',
    action_pose: '',
    details_appearance: '',
    environment_background: '',
    lighting_atmosphere: '',
    composition_framing: '',
    style_camera: '',
    colors: [],
    materials: [],
    aspect_ratio: '',
    quality_modifiers: [],
    fidelity_priorities: [],
    likely_generation_intent: ''
  },
  prompt_core: '',
  negative_prompt: '',
  recreation_prompt: 'Legacy precise reconstruction prompt with more detail'
};
assert.equal(buildHistoryTitle(legacyAnalysis), 'Legacy precise reconstruction prompt with more detail');
assert.equal(getHistoryPrompt({
  id: 'legacy',
  createdAt: '2026-06-18T00:00:00.000Z',
  title: 'Legacy',
  favorite: false,
  status: 'success',
  analysis: legacyAnalysis
}), 'Legacy precise reconstruction prompt with more detail');

const currentAnalysis = {
  ...legacyAnalysis,
  zh: { prompt: '中文界面说明提示词', analysis: '' },
  en: { prompt: 'Primary English recreation prompt for generators', analysis: '' },
  recreation_prompt: undefined
};
assert.equal(getHistoryPrompt({
  id: 'current',
  createdAt: '2026-06-18T00:00:00.000Z',
  title: 'Current',
  favorite: false,
  status: 'success',
  analysis: currentAnalysis
}, 'zh'), 'Primary English recreation prompt for generators');

await clearHistory();
await addHistoryEntry(createRunningHistoryEntry({ title: 'Check image' }));
const history = await getHistory();
assert.equal(history.length, 1);
assert.equal(history[0].status, 'running');
const canceled = await updateHistoryEntry(history[0].id, { status: 'canceled', error: '已取消识别。' });
assert.equal(canceled?.status, 'canceled');

await clearHistory();
await addHistoryEntry(createRunningHistoryEntry({
  imageUrl: 'data:image/png;base64,full-image',
  thumbnailUrl: 'data:image/webp;base64,thumb',
  title: 'Thumbnail check'
}));
await compactHistoryStorage();
const compacted = await getHistory();
assert.equal(compacted[0].imageUrl, undefined);
assert.equal(compacted[0].thumbnailUrl, 'data:image/webp;base64,thumb');

await clearHistory();
await addHistoryEntry(createRunningHistoryEntry({
  thumbnailUrl: `data:image/webp;base64,${'a'.repeat(220_000)}`,
  title: 'Oversized thumbnail check'
}));
const oversized = await getHistory();
assert.equal(oversized[0].thumbnailUrl, undefined);

console.log('storage checks passed');
