import { parsePromptAnalysis } from '../src/shared/jsonRepair';

const baseAnalysis = {
  zh: { prompt: '中文提示词。', analysis: '中文分析。' },
  en: {
    prompt:
      'Detailed dark poster with visible Chinese title, lifted central subject, layered foreground and background depth, warm light, textured material surfaces, and source-defining layout relationships that must remain recognizable.',
    analysis: 'English analysis.'
  },
  zh_style_tags: ['中文', '海报', '层次', '材质'],
  en_style_tags: ['poster', 'layered', 'text lock', 'material'],
  prompt_core: 'Dark poster with Chinese title, lifted subject, depth, warm light.',
  negative_prompt: 'missing title, missing lifted subject, flat layout, wrong material',
  json_prompt: {
    schema_version: 'reconstruction_v2',
    summary: 'test reconstruction',
    generation_prompt:
      'Generic richly detailed image with many elements and a dramatic mood, balanced layout, polished colors, and attractive lighting for high quality generation.',
    generation_negative_prompt: 'generic bad anatomy, low quality, artifacts',
    spatial_dynamics: 'central subject rises upward with foreground and midground occlusion',
    subject: 'central subject',
    action_pose: 'rises upward',
    details_appearance: 'textured ceramic and glossy surface',
    environment_background: 'layered foreground and background',
    lighting_atmosphere: 'warm light with steam haze',
    composition_framing: 'vertical poster composition',
    style_camera: 'poster realism style_index 45 of 100',
    colors: ['#111111 black - background', '#f5d28a gold - text', '#d67332 amber - light'],
    materials: ['glossy ceramic', 'dark wood'],
    aspect_ratio: '9:16',
    quality_modifiers: ['source fidelity', 'text lock', 'material lock'],
    fidelity_priorities: ['visible Chinese title priority 96 of 100', 'lifted subject priority 94 of 100'],
    global_fingerprint: {
      style_index: 45,
      density: 'dense',
      spatial_flow: 'upward central motion',
      optical_finish: ['steam haze'],
      render_finish: ['commercial poster'],
      palette: ['#111111 black - background']
    },
    observation_units: [
      {
        id: 'text',
        kind: 'text_lock',
        priority: 96,
        prompt: 'Visible Chinese title stays in the upper-left hierarchy.',
        evidence: 'Chinese title is visible',
        location: 'upper left',
        must_preserve: ['Chinese title'],
        avoid_drift: ['translated title']
      },
      {
        id: 'surface',
        kind: 'material_surface',
        priority: 90,
        prompt: 'Glossy ceramic and dark wood texture remain source-defining.',
        evidence: 'visible material surfaces',
        location: 'foreground',
        must_preserve: ['glossy ceramic', 'dark wood texture'],
        avoid_drift: ['plastic material']
      }
    ],
    text_elements: [
      {
        content: '浓汤',
        language: 'Chinese',
        role: 'main title',
        location: 'upper left',
        typography: 'large brush calligraphy',
        legibility: 'clear',
        priority: 96
      }
    ],
    reconstruction_priorities: [
      {
        cue: 'Visible Chinese title and material surface outrank generic poster polish.',
        priority: 95,
        tradeoff: 'source evidence over generic polish',
        compile_to_en_prompt: true,
        risk_if_missing: 'the output becomes a generic poster'
      }
    ],
    likely_generation_intent: 'poster recreation'
  }
};

const parsed = parsePromptAnalysis(baseAnalysis);
const generationPrompt = parsed.json_prompt.generation_prompt;
const generationNegative = parsed.json_prompt.generation_negative_prompt;

assert(generationPrompt.split(/\s+/).length >= parsed.en.prompt.split(/\s+/).length, 'generation_prompt stayed weaker than en.prompt');
assert(generationPrompt.includes('Visible Chinese title'), 'generation_prompt did not compile high-priority observation evidence');
assert(generationPrompt.includes('visible text 浓汤'), 'generation_prompt did not compile text_elements evidence');
assert(generationNegative.includes('missing Chinese text'), 'generation_negative_prompt missing Chinese text blocker');
assert(generationNegative.includes('wrong material or surface finish'), 'generation_negative_prompt missing material blocker');
assert(generationNegative.includes('missing steam haze'), 'generation_negative_prompt missing steam-specific blocker');
assert(!generationNegative.includes('missing splash droplets'), 'steam-only evidence should not create splash blocker');

const looseModelJson = `
The requested object is:
\`\`\`json
{
  // Some model providers occasionally return JavaScript-like JSON.
  zh: { prompt: '中文提示词。', analysis: '中文分析。', },
  en: ${JSON.stringify(baseAnalysis.en, null, 2)},
  zh_style_tags: ${JSON.stringify(baseAnalysis.zh_style_tags)},
  en_style_tags: ${JSON.stringify(baseAnalysis.en_style_tags)},
  prompt_core: ${JSON.stringify(baseAnalysis.prompt_core)},
  negative_prompt: ${JSON.stringify(baseAnalysis.negative_prompt)},
  json_prompt: ${JSON.stringify(baseAnalysis.json_prompt, null, 2)},
}
\`\`\`
`;

const repairedParsed = parsePromptAnalysis(looseModelJson);
assert(repairedParsed.zh.prompt === baseAnalysis.zh.prompt, 'loose JSON repair did not preserve zh.prompt');
assert(repairedParsed.en.prompt === baseAnalysis.en.prompt, 'loose JSON repair did not preserve en.prompt');
assert(
  repairedParsed.json_prompt.generation_prompt.includes('Visible Chinese title'),
  'loose JSON repair did not preserve strengthened generation_prompt evidence'
);

console.log('json repair checks passed');

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    console.error(`json repair check failed: ${message}`);
    process.exit(1);
  }
}
