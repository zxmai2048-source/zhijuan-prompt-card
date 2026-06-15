import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const reversePromptPath = join(root, 'src/shared/reversePrompt.ts');
const typesPath = join(root, 'src/shared/types.ts');

const reversePromptSource = readFileSync(reversePromptPath, 'utf8');
const typesSource = readFileSync(typesPath, 'utf8');

const promptMatch = reversePromptSource.match(/export const REVERSE_PROMPT_SYSTEM = `([\s\S]*?)`;/);
if (!promptMatch) fail('REVERSE_PROMPT_SYSTEM template literal was not found.');

const systemPrompt = promptMatch[1];

const topLevelKeys = [
  '"zh"',
  '"en"',
  '"ja"',
  '"zh_style_tags"',
  '"en_style_tags"',
  '"ja_style_tags"',
  '"json_prompt"',
  '"recreation_prompt"',
  '"prompt_core"',
  '"negative_prompt"'
];

const jsonPromptKeys = [
  '"subject"',
  '"action_pose"',
  '"details_appearance"',
  '"environment_background"',
  '"lighting_atmosphere"',
  '"composition_framing"',
  '"style_camera"',
  '"colors"',
  '"materials"',
  '"aspect_ratio"',
  '"quality_modifiers"',
  '"likely_generation_intent"'
];

const contractChecks = [
  ['task is reconstruction, not captioning', 'visual reconstruction prompt writer'],
  ['explicitly blocks captions', 'Do not write a caption'],
  ['uses visible evidence only', 'Use only visible evidence'],
  ['keeps output JSON-only', 'Return valid JSON only'],
  ['preserves exact top-level shape', 'Keep exactly this top-level shape'],
  ['sets recreation prompt as primary generation prompt', 'recreation_prompt is the primary generation prompt'],
  ['requires generator-neutral prompts', 'Do not include generator-specific syntax'],
  ['requires image-specific negative prompts', 'negative_prompt must be image-specific'],
  ['requires exact subject/object count where clear', 'Count people and repeated objects exactly'],
  ['locks spatial relationships when important', 'Lock left/right/front/back and foreground/midground/background'],
  ['requires distinctive composition details', 'If composition is distinctive'],
  ['requires optical motion detail', 'If motion or optical effects are visible'],
  ['prefers concrete geometry over generic quality words', 'Prefer concrete nouns, geometry, visible relationships, and material behavior'],
  ['requires semicolon-style structured JSON fields', 'short semicolon-separated clauses']
];

const reconstructionPriority = [
  'aspect ratio and crop',
  'subject count and relative positions',
  'camera geometry and lens feel',
  'motion, blur, and focus plane',
  'background anchors and props',
  'lighting direction and palette',
  'material finish and surface behavior',
  'medium and stylization level'
];

const simulatedCases = [
  {
    id: 'orbital_anime_energy',
    recreation:
      'Vertical 2:3 cinematic anime-style reconstruction of one young woman suspended high above Earth, viewed from an oblique aerial angle with the planet and cloud fields tilted beneath her. She is centered slightly upper right, arms crossed, head lowered, long teal-green hair streaming upward in violent wind, wearing a fitted black long-sleeve dress with high collar, thigh slit, trailing scarf-like fabric, and black heels. Bright turquoise energy streaks and vertical light trails wrap around her and converge below her feet, with strong motion blur, shallow focus, cool daylight, and atmospheric space-edge haze.',
    core:
      'One teal-haired woman falling or hovering above tilted Earth, arms crossed, black dress, turquoise energy trails, oblique aerial anime-cinematic composition.',
    negative:
      'extra people, different subject count, ground-level view, centered poster pose, smiling face, looking at camera, short hair, warm red magic, wings, weapons, city background, indoor scene, flat horizon, no Earth below, no vertical energy trails, bulky armor, casual clothing, over-polished fashion shoot lighting',
    requiredAnchors: [
      'Vertical 2:3',
      'one young woman',
      'high above Earth',
      'oblique aerial angle',
      'centered slightly upper right',
      'arms crossed',
      'teal-green hair',
      'black long-sleeve dress',
      'vertical light trails',
      'converge below her feet'
    ],
    requiredNegativeAnchors: [
      'extra people',
      'ground-level view',
      'centered poster pose',
      'warm red magic',
      'no Earth below',
      'no vertical energy trails'
    ]
  },
  {
    id: 'monochrome_studio_portrait',
    recreation:
      'Vertical monochrome editorial studio portrait in a 3:5 crop, one young adult man seated low in a black leather lounge chair, centered in the lower frame, short dark spiked hair, round glasses, serious direct gaze, dark knit cardigan over black clothes, one arm on the chair and one hand draped over a raised knee, chunky black boot pushed toward camera; two bright studio lamps on tall stands at far left and right, gray cracked plaster wall, small handwritten text above him, polished gray floor, controlled contrast and quiet negative space.',
    core:
      'Monochrome studio portrait of one seated man in a black leather chair, low framing, twin studio lamps, gray wall, boot toward camera.',
    negative:
      'extra people, missing studio lights, recentered headshot, smiling fashion pose, colorful palette, clean luxury backdrop, poster hero lighting, wrong chair material, cropped-out boots, cluttered props, text changed or oversized, shallow glamour blur',
    requiredAnchors: [
      'Vertical monochrome',
      '3:5 crop',
      'one young adult man',
      'seated low',
      'black leather lounge chair',
      'centered in the lower frame',
      'round glasses',
      'chunky black boot pushed toward camera',
      'two bright studio lamps',
      'gray cracked plaster wall'
    ],
    requiredNegativeAnchors: [
      'extra people',
      'missing studio lights',
      'recentered headshot',
      'colorful palette',
      'wrong chair material',
      'cropped-out boots'
    ]
  }
];

const failures = [];

for (const key of topLevelKeys) {
  assert(systemPrompt.includes(key), `system prompt missing output key ${key}`);
  assert(typesSource.includes(stripQuotes(key)), `PromptAnalysis type missing key ${key}`);
}

for (const key of jsonPromptKeys) {
  assert(systemPrompt.includes(key), `system prompt missing json_prompt key ${key}`);
  assert(typesSource.includes(stripQuotes(key)), `PromptAnalysis.json_prompt type missing key ${key}`);
}

for (const [label, needle] of contractChecks) {
  assert(systemPrompt.includes(needle), `contract check failed: ${label}`);
}

for (const priority of reconstructionPriority) {
  assert(systemPrompt.includes(priority), `reconstruction priority missing: ${priority}`);
}

assert(systemPrompt.length >= 5500, 'system prompt is unexpectedly short for the reconstruction contract.');
assert(systemPrompt.length <= 12000, 'system prompt is unexpectedly long; keep the runtime prompt compact enough for API use.');

for (const testCase of simulatedCases) {
  checkPromptSample(testCase);
}

if (failures.length) {
  console.error('prompt goal check failed');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('prompt goal check passed');
console.log(`- contract rules: ${contractChecks.length}`);
console.log(`- reconstruction priorities: ${reconstructionPriority.length}`);
console.log(`- simulated human cases: ${simulatedCases.length}`);

function checkPromptSample(testCase) {
  const recreationWords = wordCount(testCase.recreation);
  const coreWords = wordCount(testCase.core);
  const negativeItems = testCase.negative.split(',').map((item) => item.trim()).filter(Boolean);

  assert(recreationWords >= 50 && recreationWords <= 110, `${testCase.id}: recreation_prompt should stay near 50-90 words, got ${recreationWords}`);
  assert(coreWords >= 18 && coreWords <= 40, `${testCase.id}: prompt_core should stay compressed, got ${coreWords}`);
  assert(negativeItems.length >= 8, `${testCase.id}: negative_prompt needs image-specific drift blockers.`);
  assert(!hasGeneratorSyntax(testCase.recreation), `${testCase.id}: recreation_prompt contains generator-specific syntax.`);
  assert(!hasGeneratorSyntax(testCase.core), `${testCase.id}: prompt_core contains generator-specific syntax.`);
  assert(!hasPromptLabels(testCase.recreation), `${testCase.id}: recreation_prompt contains section labels.`);
  assert(!hasPromptLabels(testCase.core), `${testCase.id}: prompt_core contains section labels.`);

  for (const anchor of testCase.requiredAnchors) {
    assert(includesInsensitive(testCase.recreation, anchor), `${testCase.id}: recreation_prompt missing anchor "${anchor}"`);
  }
  for (const anchor of testCase.requiredNegativeAnchors) {
    assert(includesInsensitive(testCase.negative, anchor), `${testCase.id}: negative_prompt missing blocker "${anchor}"`);
  }
}

function hasGeneratorSyntax(text) {
  return /(?:^|\s)--(?:ar|s|raw|no)\b|\bBREAK\b|<lora:/i.test(text);
}

function hasPromptLabels(text) {
  return /\b(?:Subject|Lighting|Composition|Style|Camera|Negative):/i.test(text);
}

function includesInsensitive(text, needle) {
  return text.toLowerCase().includes(needle.toLowerCase());
}

function wordCount(text) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function stripQuotes(value) {
  return value.replaceAll('"', '');
}

function assert(condition, message) {
  if (!condition) failures.push(message);
}

function fail(message) {
  console.error(`prompt goal check failed: ${message}`);
  process.exit(1);
}
