import { strict as assert } from 'node:assert';
import { normalizeApiErrorMessage, normalizeChatCompletionsUrl } from '../src/shared/apiClient';

assert.equal(
  normalizeChatCompletionsUrl('https://api.openai.com/v1'),
  'https://api.openai.com/v1/chat/completions'
);
assert.equal(normalizeChatCompletionsUrl('http://x/chat/completions'), 'http://x/chat/completions');
assert.equal(normalizeChatCompletionsUrl('http://x/chat/completions/'), 'http://x/chat/completions');
assert.equal(
  normalizeApiErrorMessage('ProxyError: 503 Service Unavailable'),
  'BridgeDeck 代理暂时不可用（503）。已自动重试仍失败，请稍后再试；如果连续出现，检查或重启 127.0.0.1:1087 代理。'
);

console.log('url checks passed');
