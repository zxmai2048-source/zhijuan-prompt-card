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
  const value = typeof raw === 'string' ? parseJsonText(raw) : raw;
  if (!isRecord(value)) throw new Error('Prompt response is not a JSON object.');

  const zh = normalizeLanguageBlock(value.zh, 'zh');
  const en = normalizeLanguageBlock(value.en, 'en');
  const promptCore = requiredString(value.prompt_core, 'prompt_core');
  const negativePrompt = requiredString(value.negative_prompt, 'negative_prompt');
  const jsonPrompt = normalizeJsonPrompt(value.json_prompt, en.prompt, negativePrompt);

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

function parseJsonText(raw: string): unknown {
  const jsonText = extractJsonText(raw);
  try {
    return JSON.parse(jsonText);
  } catch (strictError) {
    const repaired = repairJsonText(jsonText);
    try {
      return JSON.parse(repaired);
    } catch (repairError) {
      throw new Error(
        `Model response was not valid JSON after conservative repair: ${formatJsonParseError(repairError || strictError)}`
      );
    }
  }
}

export function repairJsonText(raw: string): string {
  const withoutBom = raw.trim().replace(/^\uFEFF/, '');
  const withoutComments = stripJsonComments(withoutBom);
  const withJsonStrings = normalizeSingleQuotedStrings(withoutComments);
  const withoutTrailingCommas = stripTrailingCommas(withJsonStrings);
  return quoteUnquotedObjectKeys(withoutTrailingCommas);
}

function stripJsonComments(text: string): string {
  let out = '';
  let inString = false;
  let quote = '';
  let escaped = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (inString) {
      out += char;
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === quote) {
        inString = false;
        quote = '';
      }
      continue;
    }

    if (char === '"' || char === "'") {
      inString = true;
      quote = char;
      out += char;
      continue;
    }

    if (char === '/' && next === '/') {
      while (index < text.length && text[index] !== '\n') index += 1;
      if (index < text.length) out += text[index];
      continue;
    }

    if (char === '/' && next === '*') {
      index += 2;
      while (index < text.length && !(text[index] === '*' && text[index + 1] === '/')) index += 1;
      index += 1;
      continue;
    }

    out += char;
  }

  return out;
}

function stripTrailingCommas(text: string): string {
  let out = '';
  let inString = false;
  let quote = '';
  let escaped = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];

    if (inString) {
      out += char;
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === quote) {
        inString = false;
        quote = '';
      }
      continue;
    }

    if (char === '"' || char === "'") {
      inString = true;
      quote = char;
      out += char;
      continue;
    }

    if (char === ',') {
      let lookahead = index + 1;
      while (lookahead < text.length && /\s/.test(text[lookahead] || '')) lookahead += 1;
      if (text[lookahead] === '}' || text[lookahead] === ']') continue;
    }

    out += char;
  }

  return out;
}

function normalizeSingleQuotedStrings(text: string): string {
  let out = '';
  let inDoubleString = false;
  let escaped = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];

    if (inDoubleString) {
      out += char;
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === '"') {
        inDoubleString = false;
      }
      continue;
    }

    if (char === '"') {
      inDoubleString = true;
      out += char;
      continue;
    }

    if (char !== "'") {
      out += char;
      continue;
    }

    let cursor = index + 1;
    let value = '';
    let singleEscaped = false;
    while (cursor < text.length) {
      const inner = text[cursor];
      if (singleEscaped) {
        value += inner === "'" ? "'" : `\\${inner}`;
        singleEscaped = false;
      } else if (inner === '\\') {
        singleEscaped = true;
      } else if (inner === "'") {
        break;
      } else {
        value += inner;
      }
      cursor += 1;
    }

    if (cursor >= text.length || text[cursor] !== "'") {
      out += char;
      continue;
    }

    out += JSON.stringify(value);
    index = cursor;
  }

  return out;
}

function quoteUnquotedObjectKeys(text: string): string {
  let out = '';
  let inString = false;
  let quote = '';
  let escaped = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];

    if (inString) {
      out += char;
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === quote) {
        inString = false;
        quote = '';
      }
      continue;
    }

    if (char === '"' || char === "'") {
      inString = true;
      quote = char;
      out += char;
      continue;
    }

    if (char !== '{' && char !== ',') {
      out += char;
      continue;
    }

    out += char;
    let cursor = index + 1;
    while (cursor < text.length && /\s/.test(text[cursor] || '')) {
      out += text[cursor];
      cursor += 1;
    }

    const keyStart = cursor;
    if (!isIdentifierStart(text[cursor])) {
      index = cursor - 1;
      continue;
    }

    cursor += 1;
    while (cursor < text.length && isIdentifierPart(text[cursor])) cursor += 1;

    let colon = cursor;
    while (colon < text.length && /\s/.test(text[colon] || '')) colon += 1;
    if (text[colon] !== ':') {
      out += text.slice(keyStart, cursor);
      index = cursor - 1;
      continue;
    }

    out += `"${text.slice(keyStart, cursor)}"`;
    index = cursor - 1;
  }

  return out;
}

function isIdentifierStart(char: string | undefined): boolean {
  return Boolean(char && /[A-Za-z_$]/.test(char));
}

function isIdentifierPart(char: string | undefined): boolean {
  return Boolean(char && /[A-Za-z0-9_$-]/.test(char));
}

function formatJsonParseError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function normalizeLanguageBlock(value: unknown, field: string): PromptAnalysis['en'] {
  if (!isRecord(value)) throw new Error(`Prompt analysis missing ${field}.`);
  return {
    prompt: requiredString(value.prompt, `${field}.prompt`),
    analysis: requiredString(value.analysis, `${field}.analysis`)
  };
}

function normalizeJsonPrompt(value: unknown, generationPromptFallback: string, negativePromptFallback: string): PromptAnalysis['json_prompt'] {
  if (!isRecord(value)) throw new Error('Prompt analysis missing json_prompt.');
  const out: Record<string, unknown> = {};
  out.schema_version = optionalString(value.schema_version) || 'reconstruction_v2';
  out.summary = optionalString(value.summary) || optionalString(value.likely_generation_intent) || optionalString(value.subject);
  for (const field of jsonPromptStringFields) out[field] = requiredString(value[field], `json_prompt.${field}`);
  for (const field of jsonPromptArrayFields) out[field] = normalizeStringArray(value[field]);
  out.global_fingerprint = normalizeGlobalFingerprint(value.global_fingerprint, out.style_camera, out.colors);
  out.observation_units = normalizeObservationUnits(value.observation_units);
  out.text_elements = normalizeTextElements(value.text_elements);
  out.reconstruction_priorities = normalizeReconstructionPriorities(value.reconstruction_priorities, out.fidelity_priorities);
  out.spatial_dynamics = optionalString(value.spatial_dynamics) || buildSpatialDynamicsFallback(out);
  out.generation_prompt = strengthenGenerationPrompt(optionalString(value.generation_prompt), generationPromptFallback, out);
  out.generation_negative_prompt = strengthenGenerationNegativePrompt(
    optionalString(value.generation_negative_prompt),
    negativePromptFallback,
    out
  );
  return out as PromptAnalysis['json_prompt'];
}

function buildSpatialDynamicsFallback(value: Record<string, unknown>): string {
  return [
    optionalString(value.action_pose),
    optionalString(value.composition_framing),
    optionalString(value.lighting_atmosphere)
  ]
    .filter(Boolean)
    .join('; ');
}

function strengthenGenerationPrompt(supplied: string, fallback: string, value: Record<string, unknown>): string {
  const base = supplied || fallback;
  const locks = collectGenerationLocks(value).filter((cue) => !includesLoose(base, cue));
  if (!locks.length && wordCount(base) >= wordCount(fallback)) return base;

  const merged = [base, locks.length ? `Preserve ${locks.slice(0, 8).join('; ')}.` : '']
    .filter(Boolean)
    .join(' ');
  if (wordCount(merged) >= wordCount(fallback)) return merged.trim();
  return [fallback, locks.length ? `Preserve ${locks.slice(0, 8).join('; ')}.` : ''].filter(Boolean).join(' ').trim();
}

function strengthenGenerationNegativePrompt(supplied: string, fallback: string, value: Record<string, unknown>): string {
  const evidenceItems = collectGenerationNegativeLocks(value);
  const suppliedItems = commaItems(supplied);
  const fallbackItems = commaItems(fallback);
  const merged = uniqueNonEmpty([...evidenceItems, ...suppliedItems, ...fallbackItems]);
  const capped = merged.slice(0, 24);
  return capped.length ? capped.join(', ') : fallback;
}

function collectGenerationLocks(value: Record<string, unknown>): string[] {
  const locks: string[] = [];
  const spatialDynamics = optionalString(value.spatial_dynamics);
  if (spatialDynamics) locks.push(spatialDynamics);

  const fingerprint = isRecord(value.global_fingerprint) ? value.global_fingerprint : {};
  const spatialFlow = optionalString(fingerprint.spatial_flow);
  if (spatialFlow) locks.push(spatialFlow);
  for (const item of normalizeStringArray(fingerprint.optical_finish).slice(0, 4)) locks.push(item);
  for (const item of normalizeStringArray(fingerprint.render_finish).slice(0, 3)) locks.push(item);

  for (const item of Array.isArray(value.observation_units) ? value.observation_units : []) {
    if (!isRecord(item)) continue;
    if (normalizePriority(item.priority, 0) < 85) continue;
    const prompt = optionalString(item.prompt);
    if (prompt) locks.push(prompt);
  }

  for (const item of Array.isArray(value.text_elements) ? value.text_elements : []) {
    if (!isRecord(item)) continue;
    if (normalizePriority(item.priority, 0) < 80) continue;
    const content = optionalString(item.content);
    const location = optionalString(item.location);
    const typography = optionalString(item.typography);
    const cue = [content ? `visible text ${content}` : '', location ? `at ${location}` : '', typography].filter(Boolean).join(' ');
    if (cue) locks.push(cue);
  }

  for (const item of Array.isArray(value.reconstruction_priorities) ? value.reconstruction_priorities : []) {
    if (!isRecord(item)) continue;
    if (item.compile_to_en_prompt === false || normalizePriority(item.priority, 0) < 85) continue;
    const cue = optionalString(item.cue);
    if (cue) locks.push(cue);
  }

  return uniqueNonEmpty(locks);
}

function collectGenerationNegativeLocks(value: Record<string, unknown>): string[] {
  const locks: string[] = [];

  for (const item of Array.isArray(value.text_elements) ? value.text_elements : []) {
    if (!isRecord(item)) continue;
    if (normalizePriority(item.priority, 0) < 80) continue;
    const cue = [
      optionalString(item.content),
      optionalString(item.language),
      optionalString(item.role),
      optionalString(item.location),
      optionalString(item.typography)
    ].join(' ');
    appendCueDriftBlockers(locks, cue);
  }

  appendCueDriftBlockers(locks, optionalString(value.lighting_atmosphere));
  appendCueDriftBlockers(locks, optionalString(value.details_appearance));
  for (const item of normalizeStringArray(value.materials)) appendCueDriftBlockers(locks, item);

  const fingerprint = isRecord(value.global_fingerprint) ? value.global_fingerprint : {};
  appendCueDriftBlockers(locks, optionalString(fingerprint.spatial_flow));
  for (const item of normalizeStringArray(fingerprint.optical_finish)) appendCueDriftBlockers(locks, item);
  for (const item of normalizeStringArray(fingerprint.render_finish)) appendCueDriftBlockers(locks, item);

  const spatialDynamics = optionalString(value.spatial_dynamics);
  appendCueDriftBlockers(locks, spatialDynamics);

  for (const item of Array.isArray(value.observation_units) ? value.observation_units : []) {
    if (!isRecord(item)) continue;
    if (normalizePriority(item.priority, 0) < 85) continue;
    const cue = [
      optionalString(item.kind),
      optionalString(item.prompt),
      optionalString(item.location),
      ...normalizeStringArray(item.must_preserve)
    ].join(' ');
    for (const blocker of normalizeStringArray(item.avoid_drift)) locks.push(blocker);
    appendCueDriftBlockers(locks, cue);
  }

  for (const item of Array.isArray(value.reconstruction_priorities) ? value.reconstruction_priorities : []) {
    if (!isRecord(item)) continue;
    if (normalizePriority(item.priority, 0) < 85) continue;
    const cue = [optionalString(item.cue), optionalString(item.risk_if_missing)].join(' ');
    appendCueDriftBlockers(locks, cue);
  }

  return uniqueNonEmpty(locks);
}

function appendCueDriftBlockers(locks: string[], cue: string): void {
  const lower = cue.toLowerCase();
  if (!lower) return;

  if (/[一-龿]/.test(cue) || lower.includes('chinese') || lower.includes('calligraphy')) {
    locks.push('missing Chinese text', 'missing Chinese calligraphy', 'altered or translated text', 'moved text placement');
  } else if (lower.includes('text') || lower.includes('title') || lower.includes('label') || lower.includes('typography')) {
    locks.push('missing visible text', 'altered visible text', 'translated text', 'moved text placement');
  }

  if (
    lower.includes('splash') ||
    lower.includes('droplet') ||
    lower.includes('oil bead') ||
    lower.includes('floating') ||
    lower.includes('suspended') ||
    lower.includes('midair') ||
    lower.includes('orbit') ||
    lower.includes('erupt')
  ) {
    locks.push('missing splash droplets', 'missing suspended motion', 'static flat layout');
  }

  if (lower.includes('steam')) {
    locks.push('missing steam haze');
  }

  if (lower.includes('lifted') || lower.includes('rises') || lower.includes('vertical column') || lower.includes('pull')) {
    locks.push('missing lifted subject', 'flattened pose or action');
  }

  if (lower.includes('z-depth') || lower.includes('occlusion') || lower.includes('foreground') || lower.includes('midground')) {
    locks.push('collapsed depth layers', 'lost occlusion relationships');
  }

  if (
    lower.includes('material') ||
    lower.includes('surface') ||
    lower.includes('texture') ||
    lower.includes('finish') ||
    lower.includes('gloss') ||
    lower.includes('matte') ||
    lower.includes('fabric') ||
    lower.includes('ceramic') ||
    lower.includes('wood') ||
    lower.includes('metal') ||
    lower.includes('glass')
  ) {
    locks.push('wrong material or surface finish', 'lost source texture');
  }

  if (
    lower.includes('boundary') ||
    lower.includes('horizon') ||
    lower.includes('guide') ||
    lower.includes('seam') ||
    lower.includes('contour') ||
    lower.includes('zone') ||
    lower.includes('arc') ||
    lower.includes('curved') ||
    lower.includes('non-rectangular')
  ) {
    locks.push('lost boundary lines', 'straightened boundaries', 'flattened zones');
  }
}

function requiredString(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`Prompt analysis missing ${field}.`);
  return value.trim();
}

function optionalString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string' && Boolean(item.trim())).map((item) => item.trim());
}

function commaItems(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function uniqueNonEmpty(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const normalized = value.trim();
    const key = normalized.toLowerCase();
    if (!normalized || seen.has(key)) continue;
    seen.add(key);
    result.push(normalized);
  }
  return result;
}

function includesLoose(text: string, cue: string): boolean {
  const normalizedText = text.toLowerCase();
  const normalizedCue = cue.toLowerCase();
  if (normalizedText.includes(normalizedCue)) return true;
  const words = normalizedCue.match(/[a-z0-9\u4e00-\u9fff]{3,}/gi) || [];
  if (words.length < 3) return false;
  return words.slice(0, 6).filter((word) => normalizedText.includes(word.toLowerCase())).length >= Math.min(4, words.length);
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function normalizeGlobalFingerprint(value: unknown, styleCamera: unknown, colors: unknown): PromptAnalysis['json_prompt']['global_fingerprint'] {
  const record = isRecord(value) ? value : {};
  const styleIndexFallback = extractPriority(optionalString(styleCamera));
  return {
    style_index: normalizePriority(record.style_index, Number.isFinite(styleIndexFallback) ? styleIndexFallback : 0),
    density: optionalString(record.density),
    spatial_flow: optionalString(record.spatial_flow),
    optical_finish: normalizeStringArray(record.optical_finish),
    render_finish: normalizeStringArray(record.render_finish),
    palette: normalizeStringArray(record.palette).length ? normalizeStringArray(record.palette) : normalizeStringArray(colors)
  };
}

function normalizeObservationUnits(value: unknown): PromptAnalysis['json_prompt']['observation_units'] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(isRecord)
    .map((item, index) => {
      const prompt = optionalString(item.prompt) || optionalString(item.reconstruction_cue) || optionalString(item.visible_evidence);
      return {
        id: optionalString(item.id) || `unit_${index + 1}`,
        kind: optionalString(item.kind) || 'observation',
        priority: normalizePriority(item.priority, 50),
        prompt,
        evidence: optionalString(item.evidence) || optionalString(item.visible_evidence),
        location: optionalString(item.location) || optionalString(item.position),
        must_preserve: normalizeStringArray(item.must_preserve),
        avoid_drift: normalizeStringArray(item.avoid_drift)
      };
    })
    .filter((item) => Boolean(item.prompt));
}

function normalizeTextElements(value: unknown): PromptAnalysis['json_prompt']['text_elements'] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(isRecord)
    .map((item) => ({
      content: optionalString(item.content) || optionalString(item.text),
      language: optionalString(item.language),
      role: optionalString(item.role),
      location: optionalString(item.location) || optionalString(item.position),
      typography: optionalString(item.typography),
      legibility: optionalString(item.legibility),
      priority: normalizePriority(item.priority, 50)
    }))
    .filter((item) => Boolean(item.content || item.location || item.role));
}

function normalizeReconstructionPriorities(
  value: unknown,
  fallback: unknown
): PromptAnalysis['json_prompt']['reconstruction_priorities'] {
  if (Array.isArray(value)) {
    return value
      .filter(isRecord)
      .map((item) => {
        const cue = optionalString(item.cue) || optionalString(item.prompt) || optionalString(item.priority_cue);
        return {
          cue,
          priority: normalizePriority(item.priority, extractPriority(cue) || 50),
          tradeoff: optionalString(item.tradeoff),
          compile_to_en_prompt: typeof item.compile_to_en_prompt === 'boolean' ? item.compile_to_en_prompt : true,
          risk_if_missing: optionalString(item.risk_if_missing)
        };
      })
      .filter((item) => Boolean(item.cue));
  }

  return normalizeStringArray(fallback).map((cue) => ({
    cue,
    priority: extractPriority(cue) || 50,
    tradeoff: '',
    compile_to_en_prompt: true,
    risk_if_missing: ''
  }));
}

function normalizePriority(value: unknown, fallback: number): number {
  const numeric = typeof value === 'number' ? value : extractPriority(optionalString(value));
  if (!Number.isFinite(numeric)) return fallback;
  return Math.max(0, Math.min(100, Math.round(numeric)));
}

function extractPriority(value: string): number {
  const match = value.match(/\b(\d{1,3})(?:\s*(?:of|\/)\s*100)?\b/i);
  if (!match) return Number.NaN;
  const priority = Number(match[1]);
  return Number.isFinite(priority) ? priority : Number.NaN;
}
