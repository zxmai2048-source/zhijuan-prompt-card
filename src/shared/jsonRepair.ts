import type { PromptAnalysis } from './types';

const jsonPromptStringFields = [
  'subject',
  'action_pose',
  'details_appearance',
  'environment_background',
  'lighting_atmosphere',
  'composition_framing',
  'style_camera',
  'aspect_ratio',
  'likely_generation_intent'
] as const;

const jsonPromptArrayFields = ['colors', 'materials', 'quality_modifiers', 'fidelity_priorities'] as const;

export function parsePromptAnalysis(raw: unknown): PromptAnalysis {
  const value = typeof raw === 'string' ? JSON.parse(extractJsonText(raw)) : raw;
  if (!isRecord(value)) throw new Error('Prompt response is not a JSON object.');

  const zh = normalizeLanguageBlock(value.zh, 'zh');
  const en = normalizeLanguageBlock(value.en, 'en');
  const jsonPrompt = normalizeJsonPrompt(value.json_prompt);
  const promptCore = requiredString(value.prompt_core, 'prompt_core');
  const negativePrompt = requiredString(value.negative_prompt, 'negative_prompt');

  return {
    zh,
    en,
    zh_style_tags: normalizeStringArray(value.zh_style_tags),
    en_style_tags: normalizeStringArray(value.en_style_tags),
    json_prompt: jsonPrompt,
    prompt_core: promptCore,
    negative_prompt: negativePrompt
  };
}

export function extractJsonText(raw: string): string {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced?.[1]?.trim() || trimmed;
  if (candidate.startsWith('{') && candidate.endsWith('}')) return candidate;

  const first = candidate.indexOf('{');
  const last = candidate.lastIndexOf('}');
  if (first >= 0 && last > first) return candidate.slice(first, last + 1);

  throw new Error('Model response was not valid JSON.');
}

function normalizeLanguageBlock(value: unknown, field: string): PromptAnalysis['en'] {
  if (!isRecord(value)) throw new Error(`Prompt analysis missing ${field}.`);
  return {
    prompt: requiredString(value.prompt, `${field}.prompt`),
    analysis: requiredString(value.analysis, `${field}.analysis`)
  };
}

function normalizeJsonPrompt(value: unknown): PromptAnalysis['json_prompt'] {
  if (!isRecord(value)) throw new Error('Prompt analysis missing json_prompt.');
  const out: Record<string, string | string[]> = {};
  for (const field of jsonPromptStringFields) out[field] = requiredString(value[field], `json_prompt.${field}`);
  for (const field of jsonPromptArrayFields) out[field] = normalizeStringArray(value[field]);
  return out as PromptAnalysis['json_prompt'];
}

function requiredString(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`Prompt analysis missing ${field}.`);
  return value.trim();
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string' && Boolean(item.trim())).map((item) => item.trim());
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}
