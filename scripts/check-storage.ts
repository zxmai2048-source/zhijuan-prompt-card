import { strict as assert } from 'node:assert';
import { DEFAULT_SETTINGS } from '../src/shared/defaults';
import { addHistoryEntry, clearHistory, compactHistoryStorage, createRunningHistoryEntry, getHistory, getSettings, updateHistoryEntry } from '../src/shared/storage';

const settings = await getSettings();
assert.equal(settings.baseUrl, DEFAULT_SETTINGS.baseUrl);
assert.equal(settings.apiKey, DEFAULT_SETTINGS.apiKey);
assert.equal(settings.model, DEFAULT_SETTINGS.model);

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
