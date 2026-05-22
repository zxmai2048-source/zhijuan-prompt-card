import { strict as assert } from 'node:assert';
import { DEFAULT_SETTINGS } from '../src/shared/defaults';
import { addHistoryEntry, clearHistory, createRunningHistoryEntry, getHistory, getSettings } from '../src/shared/storage';

const settings = await getSettings();
assert.equal(settings.baseUrl, DEFAULT_SETTINGS.baseUrl);
assert.equal(settings.apiKey, DEFAULT_SETTINGS.apiKey);
assert.equal(settings.model, DEFAULT_SETTINGS.model);

await clearHistory();
await addHistoryEntry(createRunningHistoryEntry({ title: 'Check image' }));
const history = await getHistory();
assert.equal(history.length, 1);
assert.equal(history[0].status, 'running');

console.log('storage checks passed');
