import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { basename, dirname, extname, join } from 'node:path';
import { analyzeImageWithApi } from '../src/shared/apiClient';
import { DEFAULT_SETTINGS } from '../src/shared/defaults';
import { parsePromptAnalysis } from '../src/shared/jsonRepair';
import { REVERSE_PROMPT_SYSTEM } from '../src/shared/reversePrompt';

const existingAuditPath = process.env.ZHIJUAN_STRUCTURAL_AUDIT_FILE;
const imagePath = existingAuditPath ? undefined : process.argv[2] || process.env.ZHIJUAN_STRUCTURAL_IMAGE;
const outputPath =
  process.env.ZHIJUAN_STRUCTURAL_OUTPUT || join('tmp', 'real-image-tests', `structural-audit-${Date.now()}.json`);

if (!imagePath && !existingAuditPath) {
  console.error(
    [
      'Usage: ZHIJUAN_STRUCTURAL_IMAGE=/path/to/image.png npm run test:real-structure',
      '   or: npm run test:real-structure -- /path/to/image.png',
      '   or: ZHIJUAN_STRUCTURAL_AUDIT_FILE=tmp/real-image-tests/audit.json npm run test:real-structure',
      '',
      'Optional env:',
      '  ZHIJUAN_STRUCTURAL_OUTPUT=tmp/real-image-tests/current-structural-audit.json',
      '  ZHIJUAN_TEST_BASE_URL=http://127.0.0.1:8876/v1',
      '  ZHIJUAN_TEST_API_KEY=local-bridge',
      '  ZHIJUAN_TEST_MODEL=gpt-5.5'
    ].join('\n')
  );
  process.exit(2);
}

const started = Date.now();
const analysis = existingAuditPath ? await readExistingAnalysis(existingAuditPath) : await runRealAnalysis(imagePath as string);

const enPrompt = analysis.en?.prompt || '';
const negativePrompt = analysis.negative_prompt || '';
const jsonPrompt = analysis.json_prompt || {};
const analysisRecord = analysis as unknown as Record<string, unknown>;
const searchable = `${enPrompt}\n${negativePrompt}\n${JSON.stringify(jsonPrompt)}`.toLowerCase();
const negativeSearchable = negativePrompt.toLowerCase();

const checks = {
  schemaV2: jsonPrompt.schema_version === 'reconstruction_v2',
  noJa: !analysisRecord.ja,
  noRecreationPrompt: !analysisRecord.recreation_prompt,
  enPromptWords: wordCount(enPrompt),
  observationUnitCount: Array.isArray(jsonPrompt.observation_units) ? jsonPrompt.observation_units.length : 0,
  reconstructionPriorityCount: Array.isArray(jsonPrompt.reconstruction_priorities) ? jsonPrompt.reconstruction_priorities.length : 0,
  mentionsNonlinearGeometry:
    /(curved|arc|diagonal|irregular|organic|continuous|non-rectangular|sweeping|horizon)/i.test(searchable),
  mentionsBoundaryOrGuide:
    /(boundary|edge|line|guide|seam|horizon|arc|transition|zone|contour)/i.test(searchable),
  blocksStraightBoundaryDrift:
    /(straightened|flat rectangular|rectangular panels?|uniform grids?|equalized zones|lost boundary|lost .*arc|straight .*horizon|hard rectangular|flattened bands|straight horizontal)/i.test(
      negativeSearchable
    )
};

const requiredChecks: Array<keyof typeof checks> = [
  'schemaV2',
  'noJa',
  'noRecreationPrompt',
  'mentionsNonlinearGeometry',
  'mentionsBoundaryOrGuide',
  'blocksStraightBoundaryDrift'
];
const failed = requiredChecks.filter((key) => !checks[key]);
const audit = {
  source: existingAuditPath ? basename(existingAuditPath) : basename(imagePath as string),
  elapsedMs: Date.now() - started,
  status: failed.length ? 'failed' : 'passed',
  failed,
  checks,
  evidence: {
    promptPreview: enPrompt.slice(0, 1200),
    negativePrompt,
    reconstructionPriorities: jsonPrompt.reconstruction_priorities || [],
    highPriorityObservationUnits: Array.isArray(jsonPrompt.observation_units)
      ? jsonPrompt.observation_units.filter((unit) => Number(unit?.priority) >= 85)
      : []
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
      checks,
      negativePrompt
    },
    null,
    2
  )
);

if (failed.length) process.exit(1);

async function runRealAnalysis(path: string) {
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

async function readExistingAnalysis(path: string) {
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

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}
