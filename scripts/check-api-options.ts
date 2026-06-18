import { strict as assert } from 'node:assert';
import { applyUnsupportedParameterFallback, buildAnalysisRequestOptions } from '../src/shared/apiClient';

function hasOwn(object: object, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(object, key);
}

assert.deepEqual(buildAnalysisRequestOptions('gpt-4o'), {
  model: 'gpt-4o',
  temperature: 0.18,
  max_tokens: 12288
});

const gpt5Options = buildAnalysisRequestOptions('gpt-5.5');
assert.deepEqual(gpt5Options, {
  model: 'gpt-5.5',
  max_completion_tokens: 12288,
  reasoning_effort: 'medium'
});
assert.equal(hasOwn(gpt5Options, 'max_tokens'), false);
assert.equal(hasOwn(gpt5Options, 'temperature'), false);

assert.deepEqual(buildAnalysisRequestOptions('openai/o4-mini'), {
  model: 'openai/o4-mini',
  max_completion_tokens: 12288,
  reasoning_effort: 'medium'
});

assert.deepEqual(buildAnalysisRequestOptions('vision-reasoning'), {
  model: 'vision-reasoning',
  max_completion_tokens: 12288,
  reasoning_effort: 'medium'
});

const fallbackOptions = buildAnalysisRequestOptions('gpt-4o');
assert.equal(
  applyUnsupportedParameterFallback(
    fallbackOptions,
    "Unsupported parameter: 'max_tokens' is not supported with this model. Use 'max_completion_tokens' instead."
  ),
  true
);
assert.deepEqual(fallbackOptions, {
  model: 'gpt-4o',
  temperature: 0.18,
  max_completion_tokens: 12288
});

assert.equal(
  applyUnsupportedParameterFallback(fallbackOptions, "Unsupported parameter: 'temperature' is not supported with this model."),
  true
);
assert.deepEqual(fallbackOptions, {
  model: 'gpt-4o',
  max_completion_tokens: 12288
});
assert.equal(
  applyUnsupportedParameterFallback(fallbackOptions, "Unsupported parameter: 'temperature' is not supported with this model."),
  false
);

const reasoningFallbackOptions = buildAnalysisRequestOptions('o4-mini');
assert.equal(
  applyUnsupportedParameterFallback(
    reasoningFallbackOptions,
    "Unsupported parameter: 'reasoning_effort' is not supported with this model."
  ),
  true
);
assert.deepEqual(reasoningFallbackOptions, {
  model: 'o4-mini',
  max_completion_tokens: 12288
});

console.log('api option checks passed');
