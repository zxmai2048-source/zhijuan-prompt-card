import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { basename, dirname, extname, join } from 'node:path';
import { analyzeImageWithApi } from '../src/shared/apiClient';
import { DEFAULT_SETTINGS } from '../src/shared/defaults';
import { parsePromptAnalysis } from '../src/shared/jsonRepair';
import { REVERSE_PROMPT_SYSTEM } from '../src/shared/reversePrompt';
import type { PromptAnalysis } from '../src/shared/types';

const existingAuditPath = process.env.ZHIJUAN_JSON_AUDIT_FILE;
const imagePath = existingAuditPath ? undefined : process.argv[2] || process.env.ZHIJUAN_JSON_IMAGE;
const outputPath = process.env.ZHIJUAN_JSON_OUTPUT || join('tmp', 'real-image-tests', `json-readiness-${Date.now()}.json`);

if (!imagePath && !existingAuditPath) {
  console.error(
    [
      'Usage: ZHIJUAN_JSON_IMAGE=/path/to/image.png npm run test:real-json',
      '   or: npm run test:real-json -- /path/to/image.png',
      '   or: ZHIJUAN_JSON_AUDIT_FILE=tmp/real-image-tests/audit.json npm run test:real-json',
      '',
      'Optional env:',
      '  ZHIJUAN_JSON_OUTPUT=tmp/real-image-tests/current-json-readiness.json',
      '  ZHIJUAN_JSON_REQUIRED_PROMPT=comma,separated,anchors',
      '  ZHIJUAN_JSON_REQUIRED_NEGATIVE=comma,separated,blockers',
      '  ZHIJUAN_JSON_REQUIRED_SPATIAL=comma,separated,relationships',
      '  ZHIJUAN_JSON_FORBIDDEN_PROMPT=comma,separated,wrong,anchors',
      '  Use "|" inside one anchor for acceptable synonyms, for example z-depth|z-stack|depth.',
      '  ZHIJUAN_TEST_BASE_URL=http://127.0.0.1:8876/v1',
      '  ZHIJUAN_TEST_API_KEY=local-bridge',
      '  ZHIJUAN_TEST_MODEL=gpt-5.5'
    ].join('\n')
  );
  process.exit(2);
}

const started = Date.now();
const analysis: PromptAnalysis = existingAuditPath ? await readExistingAnalysis(existingAuditPath) : await runRealAnalysis(imagePath as string);

const jsonPrompt = analysis.json_prompt;
const enPrompt = analysis.en?.prompt || '';
const generationPrompt = jsonPrompt.generation_prompt || '';
const generationNegativePrompt = jsonPrompt.generation_negative_prompt || '';
const spatialDynamics = jsonPrompt.spatial_dynamics || '';
const promptAnchors = anchorsFromEnv('ZHIJUAN_JSON_REQUIRED_PROMPT');
const negativeAnchors = anchorsFromEnv('ZHIJUAN_JSON_REQUIRED_NEGATIVE');
const spatialAnchors = anchorsFromEnv('ZHIJUAN_JSON_REQUIRED_SPATIAL');
const forbiddenPromptAnchors = anchorsFromEnv('ZHIJUAN_JSON_FORBIDDEN_PROMPT');
const analysisRecord = analysis as unknown as Record<string, unknown>;

const checks = {
  schemaV2: jsonPrompt.schema_version === 'reconstruction_v2',
  noJa: !analysisRecord.ja,
  noRecreationPrompt: !analysisRecord.recreation_prompt,
  enPromptWords: wordCount(enPrompt),
  generationPromptWords: wordCount(generationPrompt),
  generationNegativeItems: generationNegativePrompt.split(',').filter((item: string) => item.trim()).length,
  spatialDynamicsWords: wordCount(spatialDynamics),
  promptAnchorsPresent: missingAnchors(generationPrompt, promptAnchors),
  negativeAnchorsPresent: missingAnchors(generationNegativePrompt, negativeAnchors),
  spatialAnchorsPresent: missingAnchors(spatialDynamics, spatialAnchors),
  forbiddenPromptAnchorsAbsent: presentAnchors(generationPrompt, forbiddenPromptAnchors)
};

const failed: string[] = [];
if (!checks.schemaV2) failed.push('schemaV2');
if (!checks.noJa) failed.push('noJa');
if (!checks.noRecreationPrompt) failed.push('noRecreationPrompt');
if (checks.generationPromptWords < 80) failed.push('generationPromptWords');
if (checks.generationPromptWords < checks.enPromptWords) failed.push('generationPromptWeakerThanEnglish');
if (checks.generationNegativeItems < 8) failed.push('generationNegativeItems');
if (checks.spatialDynamicsWords < 20) failed.push('spatialDynamicsWords');
if (checks.promptAnchorsPresent.length) failed.push('promptAnchorsPresent');
if (checks.negativeAnchorsPresent.length) failed.push('negativeAnchorsPresent');
if (checks.spatialAnchorsPresent.length) failed.push('spatialAnchorsPresent');
if (checks.forbiddenPromptAnchorsAbsent.length) failed.push('forbiddenPromptAnchorsAbsent');

const audit = {
  source: existingAuditPath ? basename(existingAuditPath) : basename(imagePath as string),
  elapsedMs: Date.now() - started,
  status: failed.length ? 'failed' : 'passed',
  failed,
  checks,
  evidence: {
    generationPromptPreview: generationPrompt.slice(0, 1600),
    generationNegativePrompt,
    spatialDynamics,
    topLevelNegativePrompt: analysis.negative_prompt,
    observationUnits: jsonPrompt.observation_units,
    reconstructionPriorities: jsonPrompt.reconstruction_priorities
  },
  analysis
};

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, JSON.stringify(audit, null, 2));
console.log(
  JSON.stringify(
    {
      outputPath,
      status: audit.status,
      failed,
      elapsedMs: audit.elapsedMs,
      checks: {
        ...checks,
        promptAnchorsPresent: checks.promptAnchorsPresent.length ? checks.promptAnchorsPresent : 'all-present',
        negativeAnchorsPresent: checks.negativeAnchorsPresent.length ? checks.negativeAnchorsPresent : 'all-present',
        spatialAnchorsPresent: checks.spatialAnchorsPresent.length ? checks.spatialAnchorsPresent : 'all-present',
        forbiddenPromptAnchorsAbsent: checks.forbiddenPromptAnchorsAbsent.length ? checks.forbiddenPromptAnchorsAbsent : 'all-absent'
      }
    },
    null,
    2
  )
);

if (failed.length) process.exit(1);

async function runRealAnalysis(path: string): Promise<PromptAnalysis> {
  const imageDataUrl = await fileToDataUrl(path);
  return analyzeImageWithApi({
    settings: {
      ...DEFAULT_SETTINGS,
      baseUrl: process.env.ZHIJUAN_TEST_BASE_URL || 'http://127.0.0.1:8876/v1',
      apiKey: process.env.ZHIJUAN_TEST_API_KEY || 'local-bridge',
      model: process.env.ZHIJUAN_TEST_MODEL || 'gpt-5.5'
    },
    imageDataUrl,
    promptText: REVERSE_PROMPT_SYSTEM
  });
}

async function readExistingAnalysis(path: string): Promise<PromptAnalysis> {
  const record = JSON.parse(await readFile(path, 'utf8'));
  const analysis = record.analysis || record;
  if (!analysis?.json_prompt) throw new Error(`Existing audit file does not contain analysis.json_prompt: ${path}`);
  return parsePromptAnalysis(analysis);
}

async function fileToDataUrl(path: string): Promise<string> {
  const buffer = await readFile(path);
  return `data:${mimeForPath(path)};base64,${buffer.toString('base64')}`;
}

function mimeForPath(path: string): string {
  const extension = extname(path).toLowerCase();
  if (extension === '.jpg' || extension === '.jpeg') return 'image/jpeg';
  if (extension === '.webp') return 'image/webp';
  if (extension === '.gif') return 'image/gif';
  return 'image/png';
}

function anchorsFromEnv(name: string): string[] {
  return (process.env[name] || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function missingAnchors(text: string, anchors: string[]): string[] {
  const normalized = text.toLowerCase();
  return anchors.filter((anchor) => !anchorMatches(normalized, anchor));
}

function presentAnchors(text: string, anchors: string[]): string[] {
  const normalized = text.toLowerCase();
  return anchors.filter((anchor) => anchorMatches(normalized, anchor));
}

function anchorMatches(normalizedText: string, anchor: string): boolean {
  return anchor
    .split('|')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
    .some((item) => normalizedText.includes(item));
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}
