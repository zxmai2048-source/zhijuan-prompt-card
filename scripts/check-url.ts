import { strict as assert } from 'node:assert';
import { normalizeChatCompletionsUrl } from '../src/shared/apiClient';

assert.equal(
  normalizeChatCompletionsUrl('https://api.openai.com/v1'),
  'https://api.openai.com/v1/chat/completions'
);
assert.equal(normalizeChatCompletionsUrl('http://x/chat/completions'), 'http://x/chat/completions');
assert.equal(normalizeChatCompletionsUrl('http://x/chat/completions/'), 'http://x/chat/completions');

console.log('url checks passed');
