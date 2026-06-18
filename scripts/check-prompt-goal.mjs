import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const reversePromptPath = join(root, 'src/shared/reversePrompt.ts');
const typesPath = join(root, 'src/shared/types.ts');
const panelPath = join(root, 'src/content/panel.tsx');
const jsonRepairPath = join(root, 'src/shared/jsonRepair.ts');

const reversePromptSource = readFileSync(reversePromptPath, 'utf8');
const typesSource = readFileSync(typesPath, 'utf8');
const panelSource = readFileSync(panelPath, 'utf8');
const jsonRepairSource = readFileSync(jsonRepairPath, 'utf8');

const promptMatch = reversePromptSource.match(/export const REVERSE_PROMPT_SYSTEM = `([\s\S]*?)`;/);
if (!promptMatch) fail('REVERSE_PROMPT_SYSTEM template literal was not found.');

const systemPrompt = promptMatch[1];
const failures = [];

const topLevelKeys = [
  '"zh"',
  '"en"',
  '"zh_style_tags"',
  '"en_style_tags"',
  '"json_prompt"',
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
  '"fidelity_priorities"',
  '"likely_generation_intent"'
];

const contractChecks = [
  ['source fidelity is first-class', 'Source fidelity first'],
  ['aesthetic fingerprint is first-class', 'Aesthetic fingerprint'],
  ['observed facts are still required', 'Observed facts'],
  ['output discipline is retained', 'Output discipline'],
  ['quality is conditional', 'Quality only when source supports it'],
  ['visual fingerprint vocabulary covers soft focus', 'soft focus'],
  ['visual fingerprint vocabulary covers foreground blur', 'foreground blur'],
  ['visual fingerprint vocabulary covers volumetric light', 'volumetric or Tyndall light'],
  ['visual fingerprint vocabulary covers compression texture', 'compression texture'],
  ['recognizable anchors retained', 'known public person, fictional/anime/game/comic/movie character'],
  ['private identity is not invented', 'For unknown private people, do not invent names'],
  ['real-person appearance fidelity retained', 'skin tone depth and undertone'],
  ['ancestry presentation is cautious but allowed', 'Ethnic or ancestry presentation is not verified identity'],
  ['visible text original language retained', 'Preserve original language and script'],
  ['text translation blocked', 'do not translate, romanize, paraphrase, replace, invent, or reorder text'],
  ['screenshot and UI fidelity retained', 'preserve the image as that object or capture'],
  ['surface relationship fidelity retained', 'For surface relationships, describe what is visible'],
  ['ambiguous surfaces use one target', 'Use one clear generation target, not alternatives'],
  ['style_index retained', 'style_index means visual stylization intensity'],
  ['camera language remains cue-only', 'visual reconstruction cues, not factual metadata'],
  ['HEX color palette retained', 'approximate HEX colors with color name and visual role'],
  ['JSON must not drop key facts', 'do not remove load-bearing facts to make them short'],
  ['fidelity priorities are plain-language controls', 'fidelity_priorities are plain-language reconstruction priorities'],
  ['fidelity priorities use 0-100 wording', 'priority N of 100'],
  ['high-priority fidelity must reach English prompt', 'Every high-priority fidelity item must be compiled into en.prompt'],
  ['English prompt is primary', 'en.prompt is the primary generation prompt'],
  ['English prompt can scale to reconstruction need', 'with no fixed word cap'],
  ['dense sources can expand as needed', 'should expand as needed'],
  ['dense sources must not be over-compressed', 'Do not squeeze load-bearing structure into a generic archetype'],
  ['negative prompt is image-specific', 'negative_prompt is image-specific'],
  ['source blur is not blocked globally', 'Do not put blur, grain, haze, bloom, low resolution'],
  ['soft-source blockers target polish drift', 'over-sharpened face, glossy AI skin, hyper-detailed eyes'],
  ['cleanliness guidance is conditional', 'For genuinely clean/smooth/high-clarity sources'],
  ['generator syntax blocked', 'Do not include generator-specific syntax']
];

const forbiddenSystemPatterns = [
  ['global always include quality language', /\balways include\b/i],
  ['default ultra clear language', /\bultra clear\b/i],
  ['default highly detailed language', /\bhighly detailed\b/i],
  ['default sharp face language', /\bsharp face\b/i],
  ['default smooth skin language', /\bsmooth skin\b/i],
  ['default clean studio language', /\bclean studio\b(?! lighting)/i],
  ['forced all images to be crisp', /\bmust be crisp\b/i],
  ['forced all images to be sharp', /\bmust be sharp\b/i],
  ['forced all images to be clean', /\bmust be clean\b/i]
];

const simulatedCases = [
  {
    id: 'purple_soft_focus_anime',
    recreation:
      'Soft-focus vertical anime portrait with low contrast and hazy violet light, one pale young woman with long deep-purple hair turning over her shoulder, partially obscured eyes under loose bangs, distant unfocused gaze, muted lips, translucent pale fabric over the shoulder, drifting petal shapes in the blurred foreground. The crop is narrow and intimate, face placed high center-left, hair and foreground petals creating a veil over the image. Preserve the dreamlike film blur, violet bloom, dappled light on the cheek and shoulder, shallow depth of field, dim lavender shadows, and compressed small-reference softness rather than upgrading into a crisp glossy illustration. style_index 74 out of 100, atmospheric anime painterly realism with soft edges and low-detail shadow gradients.',
    core:
      'Soft-focus violet anime portrait, purple-haired woman turning over shoulder, partially obscured eyes, hazy bloom, petal foreground blur, low-contrast painterly realism.',
    negative:
      'sharp glossy anime face, hyper-detailed eyes, commercial beauty retouching, clean studio lighting, high-contrast HDR, plastic skin, over-sharpened hair strands, saturated neon purple, centered poster face, wide landscape crop, missing foreground blur, missing hazy violet light',
    requiredAnchors: [
      'Soft-focus',
      'low contrast',
      'hazy violet light',
      'partially obscured eyes',
      'blurred foreground',
      'dreamlike film blur',
      'violet bloom',
      'dappled light',
      'shallow depth of field',
      'compressed small-reference softness',
      'rather than upgrading into a crisp glossy illustration'
    ],
    forbiddenAnchors: [
      'ultra clear',
      'sharp face',
      'smooth skin',
      'clean subject',
      'highly detailed'
    ],
    requiredNegativeAnchors: [
      'sharp glossy anime face',
      'hyper-detailed eyes',
      'commercial beauty retouching',
      'clean studio lighting',
      'over-sharpened hair strands',
      'missing foreground blur',
      'missing hazy violet light'
    ]
  },
  {
    id: 'soft_focus_nightlife_conflict',
    recreation:
      'Soft-focus nightlife fashion photo with diffusion-filter softness, low micro-contrast, warm bloom, halation around glass highlights, faint film grain, and phone-photo compression feel leading the look before any crisp fashion detail. Two adult East Asian-presenting women in pastel embroidered hanfu-inspired sheer gowns stand close together in a dim luxury bar interior, one in pale pink facing the camera with lowered eyes, the other in pale blue leaning to kiss her cheek, long black hair with floral hair ornaments and delicate dangling accessories. Keep the full-body vertical crop, mirrored glass cabinet at the left, large disco ball in the upper right, dark reflective ceiling, glossy black floor reflections, champagne glass tower at the right, softly readable luxury branding near the cabinet, and nightclub stair lights in the background. Prioritize the hazy lens diffusion, softened facial micro-detail, muted skin texture, light bleed, and compressed low-light atmosphere over crisp catalog clarity while keeping the clothing silhouettes, pose relationship, logo placement, glass reflections, and scene layout recognizable rather than redesigned into a sharp commercial studio fashion campaign.',
    core:
      'Soft-focus nightlife photo of two hanfu-inspired women in a dim luxury bar, diffusion bloom, halation, disco ball, glass reflections, phone-photo compression.',
    negative:
      'tack-sharp studio fashion photo, hard-edged product catalog lighting, hyper-detailed face, glossy AI skin, over-sharpened eyes, razor-sharp glass reflections, crisp luxury campaign, clean studio relighting, high-contrast HDR, plastic skin texture, missing warm bloom, missing halation, missing phone-photo compression feel, deep focus everywhere, redesigned bar interior',
    fidelityPriorities: [
      'soft focus priority 94 of 100 - lead reconstruction with softened edges and facial micro-detail',
      'lens diffusion priority 91 of 100 - preserve hazy glow before crisp glass detail',
      'bloom and halation priority 88 of 100 - keep warm light bleed around reflective highlights',
      'phone-photo compression priority 80 of 100 - retain low-light consumer-photo texture',
      'fine-detail sharpness priority 30 of 100 - keep clothing and logo recognizable but secondary'
    ],
    requiredEarlyAnchors: [
      'Soft-focus nightlife',
      'diffusion-filter softness',
      'low micro-contrast',
      'warm bloom',
      'halation',
      'phone-photo compression feel'
    ],
    requiredAnchors: [
      'two adult East Asian-presenting women',
      'pastel embroidered hanfu-inspired sheer gowns',
      'dim luxury bar interior',
      'pale pink',
      'pale blue',
      'floral hair ornaments',
      'full-body vertical crop',
      'mirrored glass cabinet',
      'large disco ball',
      'champagne glass tower',
      'softly readable luxury branding',
      'Prioritize the hazy lens diffusion',
      'softened facial micro-detail',
      'compressed low-light atmosphere',
      'rather than redesigned into a sharp commercial studio fashion campaign'
    ],
    forbiddenAnchors: [
      'ultra clear',
      'sharp face',
      'smooth skin',
      'highly detailed eyes',
      'crisp product photography'
    ],
    requiredNegativeAnchors: [
      'tack-sharp studio fashion photo',
      'hard-edged product catalog lighting',
      'hyper-detailed face',
      'glossy AI skin',
      'over-sharpened eyes',
      'razor-sharp glass reflections',
      'crisp luxury campaign',
      'clean studio relighting',
      'missing warm bloom',
      'missing halation',
      'missing phone-photo compression feel'
    ],
    forbiddenNegativeAnchors: [
      'no bloom',
      'remove bloom',
      'without bloom',
      'no halation',
      'remove halation',
      'no compression',
      'remove grain'
    ],
    requiredFidelityAnchors: [
      'soft focus priority 94 of 100',
      'lens diffusion priority 91 of 100',
      'bloom and halation priority 88 of 100',
      'phone-photo compression priority 80 of 100',
      'fine-detail sharpness priority 30 of 100'
    ]
  },
  {
    id: 'yellow_knit_low_angle_phone',
    recreation:
      'Low-angle vertical phone photo from below the waist looking up at one adult woman indoors, warm window overexposure at the top-left, yellow open crochet knit sweater lifted by both hands, white ribbed drawstring pants at the bottom edge, bare abdomen and navel dominating the center, loose brown hair falling over the face, relaxed natural expression. Preserve the everyday phone snapshot feel, slightly awkward close perspective, blown window highlight, warm backlight, crochet light pattern projected across the abdomen, natural imperfect skin texture, shallow indoor depth, and soft lens exposure rather than turning it into a studio glamour portrait. style_index 18 out of 100, literal casual realism with golden fabric texture and sunlit perforated shadows.',
    core:
      'Low-angle phone photo of woman lifting yellow crochet sweater, bare abdomen with crochet light pattern, window overexposure, warm casual indoor realism.',
    negative:
      'studio glamour portrait, fashion campaign lighting, glossy AI skin, commercial retouching, flattened camera angle, perfect symmetrical pose, removed window overexposure, missing crochet light pattern, airbrushed abdomen, luxury bedroom set, cinematic model shoot, over-sharpened skin texture',
    requiredAnchors: [
      'Low-angle vertical phone photo',
      'window overexposure',
      'yellow open crochet knit sweater',
      'bare abdomen and navel',
      'everyday phone snapshot feel',
      'slightly awkward close perspective',
      'crochet light pattern',
      'natural imperfect skin texture',
      'rather than turning it into a studio glamour portrait'
    ],
    forbiddenAnchors: [
      'ALEXA',
      'cinema camera',
      '85mm portrait',
      'smooth skin',
      'highly detailed'
    ],
    requiredNegativeAnchors: [
      'studio glamour portrait',
      'fashion campaign lighting',
      'glossy AI skin',
      'commercial retouching',
      'removed window overexposure',
      'missing crochet light pattern',
      'airbrushed abdomen'
    ]
  },
  {
    id: 'scorpion_dark_soft_focus_duo',
    recreation:
      'Compressed narrow vertical dark fantasy portrait of two adult women in black and metallic scorpion-themed costumes, low-angle close foreground figure with glossy black armor, gold snake-like headpiece, jewelry, soft-focus highlights, pale reflective skin, parted lips, and heavy dark eye makeup; second woman stands blurred behind her in purple-black armor with a raised segmented scorpion tail silhouette. Preserve the small low-light source image feel, dark haze, smoky purple background, shallow focus separation, reflective costume speculars, compressed portrait crop, slightly soft facial detail, and moody nightclub fantasy texture rather than a clean ultra-detailed fantasy poster. style_index 62 out of 100, cosplay editorial meets dark fantasy with diffusion and low-key lighting.',
    core:
      'Compressed dark fantasy portrait of two scorpion-costumed women, low-angle foreground figure, smoky purple haze, reflective black armor, soft-focus low-light texture.',
    negative:
      'ultra-clean fantasy poster, sharp commercial render, bright studio beauty lighting, glossy AI skin, hyper-detailed face, missing dark haze, missing second woman, missing scorpion tail, flat black background, wide crop, clean costume catalog photo, over-sharpened jewelry',
    requiredAnchors: [
      'Compressed narrow vertical',
      'two adult women',
      'low-angle close foreground figure',
      'soft-focus highlights',
      'second woman stands blurred behind',
      'dark haze',
      'smoky purple background',
      'shallow focus separation',
      'reflective costume speculars',
      'compressed portrait crop',
      'rather than a clean ultra-detailed fantasy poster'
    ],
    forbiddenAnchors: [
      'clean and transparent',
      'clear main subject',
      'ultra clear',
      'sharp face',
      'smooth uniform texture'
    ],
    requiredNegativeAnchors: [
      'ultra-clean fantasy poster',
      'sharp commercial render',
      'bright studio beauty lighting',
      'glossy AI skin',
      'hyper-detailed face',
      'missing dark haze',
      'missing scorpion tail'
    ]
  },
  {
    id: 'red_hair_pen_foreground_blur',
    recreation:
      'Narrow vertical smoky back-alley portrait of one adult woman with red hair tied in a messy low bun, black glossy leather jacket, beige ribbed crop top, dark pants, standing in a cramped industrial corridor with lockers, boxes, mist, a bright pink-white backlight, and a visible STAFF ONLY sign on the right. Her arm reaches toward the lens holding a white pen marked vibeshot.club, with the hand and pen large in the foreground and noticeably out of focus while her face remains softly focused behind it. Preserve the foreground hand blur, shallow depth of field, smoky alley atmosphere, watermark and text placement, small compressed portrait feel, leather highlights, and backlit haze rather than a clean cosplay studio portrait. style_index 38 out of 100, gritty staged photo realism with diffusion.',
    core:
      'Smoky back-alley portrait of red-haired woman reaching a vibeshot.club pen toward camera, foreground hand blur, shallow depth, leather jacket, STAFF ONLY sign.',
    negative:
      'clean cosplay studio portrait, sharp foreground hand, missing pen text, changed watermark placement, removed STAFF ONLY sign, bright clean hallway, glossy AI skin, commercial retouching, perfect beauty headshot, missing smoky back alley, deep focus everywhere, wide crop, over-sharpened face',
    requiredAnchors: [
      'foreground',
      'out of focus',
      'smoky back-alley portrait',
      'shallow depth of field',
      'watermark and text placement',
      'vibeshot.club',
      'STAFF ONLY sign',
      'backlit haze',
      'rather than a clean cosplay studio portrait'
    ],
    forbiddenAnchors: [
      'crisp readable controls',
      'clean studio',
      'sharp foreground hand',
      'smooth skin',
      'highly detailed face'
    ],
    requiredNegativeAnchors: [
      'clean cosplay studio portrait',
      'sharp foreground hand',
      'missing pen text',
      'changed watermark placement',
      'removed STAFF ONLY sign',
      'missing smoky back alley',
      'deep focus everywhere'
    ]
  },
  {
    id: 'tatsumaki_recognition_regression',
    recreation:
      'Tatsumaki, Tornado of Terror from One Punch Man, one petite green-haired esper woman hovering high above Earth in a vertical 2:3 composition, oblique aerial viewpoint with the curved planet and cloud layers tilted beneath her, arms crossed, head lowered, hair streaming upward, fitted black long-sleeve dress with high collar and thigh slit, trailing scarf-like fabric, black heels. Preserve the source anime-CG painterly softness, translucent teal psychic wisps, thin vertical energy trails converging below her feet, atmospheric scale, restrained contrast, and matte black fabric surface, not a generic green-haired anime woman or glossy superhero poster. style_index 78 out of 100.',
    core:
      'Tatsumaki from One Punch Man hovering above tilted Earth, crossed arms, black dress, teal psychic energy, soft atmospheric anime-CG style.',
    negative:
      'generic anime woman, wrong character, extra people, ground-level view, centered poster pose, glossy latex outfit, oily skin, giant hair mass, thick neon beam, no Earth below, no vertical energy trails, harsh HDR contrast',
    requiredAnchors: [
      'Tatsumaki',
      'One Punch Man',
      'one petite green-haired esper woman',
      'high above Earth',
      'vertical 2:3',
      'oblique aerial viewpoint',
      'arms crossed',
      'black long-sleeve dress',
      'anime-CG painterly softness',
      'translucent teal psychic wisps'
    ],
    requiredNegativeAnchors: [
      'generic anime woman',
      'wrong character',
      'ground-level view',
      'glossy latex outfit',
      'no Earth below'
    ]
  },
  {
    id: 'luotianyi_poster_regression',
    recreation:
      'Wide 16:9 Luo Tianyi Chinese concert poster, preserve the original Chinese text and layout, top-left logo text 洛天依 LUOTIANYI, large glowing aqua Chinese title 迎春归乐 centered across the lower middle, smaller Chinese lines 洛天依全国巡回演唱会, 杭州站, 6月19日19:00, 全面开售 stacked below with the same hierarchy. Pastel blue-green garden fantasy illustration with white-haired anime girl left of center, vine staff, flowers, butterflies, doves, floating wooden crates, and dark teal lower gradient band. Preserve watercolor anime brush texture, soft translucent glow, typography scale, date position, and original script, not an English remake or rearranged fantasy banner. style_index 82 out of 100.',
    core:
      'Luo Tianyi Chinese concert poster, original Chinese title and date preserved, pastel fantasy garden, white-haired anime girl, centered glowing typography.',
    negative:
      'translated English title, romanized Chinese, invented event text, changed date, changed time, moved title, oversized typography, missing Luo Tianyi logo, wrong text language, text covering face, wrong aspect ratio',
    requiredAnchors: [
      'Wide 16:9',
      'Luo Tianyi',
      'original Chinese text',
      '洛天依 LUOTIANYI',
      '迎春归乐',
      '洛天依全国巡回演唱会',
      '杭州站',
      '6月19日19:00',
      '全面开售',
      'original script'
    ],
    requiredNegativeAnchors: [
      'translated English title',
      'romanized Chinese',
      'invented event text',
      'changed date',
      'moved title',
      'wrong text language'
    ]
  },
  {
    id: 'sofascore_ui_regression',
    recreation:
      'Wide browser screenshot reconstruction of a dark Sofascore football match dashboard with a Zhijuan Prompt Card floating panel overlay on the right, preserving screenshot crop, page layout, visible Chinese UI labels, right-side overlay z-order, top navigation, Sofascore logo, left league sidebar, Belgium versus Egypt 0-0 live scoreboard, formation board, right column ad, and match events partly covered by the prompt panel. Degraded UI thumbnail source reconstructed as a clean readable screenshot while keeping the same relative geometry, not a redesigned website or marketing mockup. style_index 12 out of 100, dark teal-black interface capture.',
    core:
      'Readable Sofascore browser screenshot with Zhijuan Prompt Card overlay, dark UI, Belgium versus Egypt scoreboard, preserved crop and layout.',
    negative:
      'redesigned website, different website, full-page mockup, missing prompt overlay, wrong overlay position, translated UI labels, invented teams, wrong score, missing Sofascore logo, missing left sidebar, missing formation board, marketing landing page',
    requiredAnchors: [
      'browser screenshot',
      'Sofascore',
      'Zhijuan Prompt Card floating panel overlay',
      'visible Chinese UI labels',
      'right-side overlay z-order',
      'Belgium versus Egypt 0-0',
      'degraded UI thumbnail',
      'clean readable screenshot',
      'same relative geometry',
      'not a redesigned website'
    ],
    requiredNegativeAnchors: [
      'redesigned website',
      'different website',
      'missing prompt overlay',
      'wrong overlay position',
      'translated UI labels',
      'wrong score'
    ]
  },
  {
    id: 'mirror_selfie_real_person_regression',
    recreation:
      'Square casual bathroom mirror selfie of two adult women standing side by side in front of a sink, both with dark messy high buns, warm tan skin tones with natural texture and visible undertones, East Asian-presenting facial features, oval-to-heart face shapes, dark eyes, soft everyday makeup, slim athletic body proportions. The left woman holds a phone at chest height in a white knotted crop T-shirt and pale pink bikini bottoms with a navel piercing; the right woman brushes her teeth in an oversized white T-shirt lifted at the waist and leopard bikini bottom. Preserve cream tile bathroom, black door, white shower curtain, cluttered counter, mirror specks, direct mirror-camera perspective, and casual phone-photo realism, not a studio fashion shoot.',
    core:
      'Two adult women in casual bathroom mirror selfie, warm tan skin, dark messy buns, white tops, bikini bottoms, phone, toothbrush, sink clutter.',
    negative:
      'changed skin tone, different facial structure, altered body proportions, beauty-polished substitute face, changed ethnic presentation, commercial glamour retouching, plastic skin, studio fashion shoot, luxury hotel bathroom, missing mirror specks, removed counter clutter, wrong clothing, missing phone, missing toothbrush',
    requiredAnchors: [
      'Square casual bathroom mirror selfie',
      'two adult women',
      'warm tan skin tones',
      'natural texture',
      'visible undertones',
      'East Asian-presenting',
      'oval-to-heart face shapes',
      'cluttered counter',
      'mirror specks',
      'casual phone-photo realism',
      'not a studio fashion shoot'
    ],
    requiredNegativeAnchors: [
      'changed skin tone',
      'different facial structure',
      'altered body proportions',
      'beauty-polished substitute face',
      'commercial glamour retouching',
      'missing mirror specks',
      'removed counter clutter'
    ]
  },
  {
    id: 'korean_soccer_surface_regression',
    recreation:
      'Vertical night football-stadium portrait of one young adult East Asian-presenting woman with platinum-silver wavy hair, soft oval face, natural glossy skin with visible sweat, calm direct gaze, holding a soccer ball under her left arm while her right hand lifts hair. Upper chest shows a tight white shoulder-strap top surface with Korean flag graphics, red-blue taegeuk circle, black trigram marks, black-and-white shield tiger crest, and small red-blue-white bow. Waist, exposed abdomen, navel, hips, and upper thighs show a seamless body-contour white paint-like skin-tight surface with rough red, blue, and black brush-painted strokes following body curves, with no visible separate shorts seam and no loose garment edge. Preserve stadium crowd, Korean flags, green turf, floodlights, wet shine, and national-color ball graphics.',
    core:
      'Korean stadium fan portrait, silver-haired woman holding soccer ball, white strap top and body-contour Korean flag brush-painted surface, floodlit pitch.',
    negative:
      'single printed swimsuit, generic jersey and shorts, visible waistband, fabric hem, clean printed uniform, missing exposed abdomen, missing navel, missing brush paint, wrong national colors, missing soccer ball, changed skin tone, different facial structure, altered body proportions, plastic skin, empty stadium',
    requiredAnchors: [
      'East Asian-presenting',
      'platinum-silver wavy hair',
      'visible sweat',
      'soccer ball',
      'Korean flag graphics',
      'red-blue taegeuk circle',
      'black trigram marks',
      'shield tiger crest',
      'exposed abdomen',
      'navel',
      'rough red, blue, and black brush-painted strokes',
      'no visible separate shorts seam',
      'loose garment edge',
      'stadium crowd',
      'Korean flags'
    ],
    requiredNegativeAnchors: [
      'single printed swimsuit',
      'generic jersey and shorts',
      'visible waistband',
      'fabric hem',
      'missing exposed abdomen',
      'missing navel',
      'missing brush paint',
      'wrong national colors'
    ],
    forbiddenAnchors: [
      'possibly',
      'maybe',
      'A or B',
      'painted or skin-tight',
      'therefore',
      'should preserve'
    ]
  }
];

for (const key of topLevelKeys) {
  assert(systemPrompt.includes(key), `system prompt missing output key ${key}`);
  assert(typesSource.includes(stripQuotes(key)), `PromptAnalysis type missing key ${key}`);
}

for (const key of jsonPromptKeys) {
  assert(systemPrompt.includes(key), `system prompt missing json_prompt key ${key}`);
  assert(typesSource.includes(stripQuotes(key)), `PromptAnalysis.json_prompt type missing key ${key}`);
}
assert(jsonRepairSource.includes("'fidelity_priorities'"), 'parsePromptAnalysis should normalize json_prompt.fidelity_priorities.');

for (const [label, needle] of contractChecks) {
  assert(systemPrompt.includes(needle), `contract check failed: ${label}`);
}

for (const [label, pattern] of forbiddenSystemPatterns) {
  assert(!pattern.test(systemPrompt), `forbidden system direction found: ${label}`);
}

assert(!systemPrompt.includes('"ja"'), 'system prompt should not request hidden Japanese output.');
assert(!systemPrompt.includes('"ja_style_tags"'), 'system prompt should not request hidden Japanese style tags.');
assert(!systemPrompt.includes('"recreation_prompt"'), 'system prompt should not request a duplicate recreation_prompt field.');
assert(systemPrompt.length >= 5200, 'system prompt is unexpectedly short for the fusion reconstruction contract.');
assert(systemPrompt.length <= 11000, 'system prompt is too long; keep the runtime prompt compact enough for API use.');
assert(!panelSource.includes('analysis[tab].prompt}\\n\\n${analysis[tab].analysis'), 'language tab output must not concatenate prompt and analysis.');
assert(panelSource.includes('return analysis[tab].prompt;'), 'language tab output should display/copy only the prompt text.');
assert(panelSource.includes('props.onOpenGenerator(siteId, analysis.en.prompt)'), 'generator handoff must use en.prompt as the primary recreation prompt.');
assert(!panelSource.includes('recreation_prompt'), 'panel should not depend on a duplicate recreation_prompt output field.');

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
console.log(`- simulated fidelity cases: ${simulatedCases.length}`);

function checkPromptSample(testCase) {
  const recreationWords = wordCount(testCase.recreation);
  const coreWords = wordCount(testCase.core);
  const negativeItems = testCase.negative.split(',').map((item) => item.trim()).filter(Boolean);

  assert(recreationWords >= 70, `${testCase.id}: en.prompt should be complete, got ${recreationWords}`);
  assert(coreWords >= 12 && coreWords <= 45, `${testCase.id}: prompt_core should stay compressed, got ${coreWords}`);
  assert(negativeItems.length >= 6 && negativeItems.length <= 24, `${testCase.id}: negative_prompt needs image-specific drift blockers, got ${negativeItems.length}.`);
  assert(!hasGeneratorSyntax(testCase.recreation), `${testCase.id}: en.prompt contains generator-specific syntax.`);
  assert(!hasGeneratorSyntax(testCase.core), `${testCase.id}: prompt_core contains generator-specific syntax.`);
  assert(!hasPromptLabels(testCase.recreation), `${testCase.id}: en.prompt contains section labels.`);
  assert(!hasPromptLabels(testCase.core), `${testCase.id}: prompt_core contains section labels.`);
  assert(!hasPromptReasoning(testCase.recreation), `${testCase.id}: en.prompt contains reasoning or uncertainty wording.`);
  assert(!hasPromptReasoning(testCase.core), `${testCase.id}: prompt_core contains reasoning or uncertainty wording.`);

  for (const anchor of testCase.requiredAnchors || []) {
    assert(includesInsensitive(testCase.recreation, anchor), `${testCase.id}: en.prompt missing anchor "${anchor}"`);
  }
  for (const anchor of testCase.requiredEarlyAnchors || []) {
    assertAppearsEarly(testCase.recreation, anchor, testCase.id);
  }
  for (const anchor of testCase.forbiddenAnchors || []) {
    assert(!includesInsensitive(testCase.recreation, anchor), `${testCase.id}: en.prompt should not include "${anchor}"`);
  }
  for (const anchor of testCase.requiredNegativeAnchors || []) {
    assert(includesInsensitive(testCase.negative, anchor), `${testCase.id}: negative_prompt missing blocker "${anchor}"`);
  }
  for (const anchor of testCase.forbiddenNegativeAnchors || []) {
    assert(!includesInsensitive(testCase.negative, anchor), `${testCase.id}: negative_prompt should not include "${anchor}"`);
  }
  checkFidelityPriorities(testCase);
}

function hasGeneratorSyntax(text) {
  return /(?:^|\s)--(?:ar|s|raw|iw|no)\b|\bBREAK\b|<lora:|\[[^\]]+\]|\([^)]*\)|::\d/i.test(text);
}

function hasPromptLabels(text) {
  return /\b(?:Subject|Lighting|Composition|Style|Camera|Negative):/i.test(text);
}

function hasPromptReasoning(text) {
  return /\b(?:because|therefore|possibly|maybe|may|might|appears to be|should preserve|needs to keep)\b|可能|或者|因此|需保留|[\p{L}\p{N}-]+\/[\p{L}\p{N}-]+/iu.test(text);
}

function includesInsensitive(text, needle) {
  return text.toLowerCase().includes(needle.toLowerCase());
}

function assertAppearsEarly(text, needle, id) {
  const index = text.toLowerCase().indexOf(needle.toLowerCase());
  assert(index >= 0, `${id}: en.prompt missing early anchor "${needle}"`);
  assert(index <= Math.ceil(text.length * 0.35), `${id}: en.prompt should introduce "${needle}" before subject/detail cues.`);
}

function checkFidelityPriorities(testCase) {
  if (!testCase.fidelityPriorities) return;
  assert(testCase.fidelityPriorities.length >= 3 && testCase.fidelityPriorities.length <= 7, `${testCase.id}: fidelity_priorities should contain 3-7 items.`);
  for (const item of testCase.fidelityPriorities) {
    assert(/priority \d{1,3} of 100/i.test(item), `${testCase.id}: fidelity priority missing "priority N of 100" wording: ${item}`);
    assert(!hasGeneratorSyntax(item), `${testCase.id}: fidelity priority contains generator-specific syntax: ${item}`);
    assert(!item.includes('/100'), `${testCase.id}: fidelity priority should use "of 100", not slash syntax.`);
  }
  for (const anchor of testCase.requiredFidelityAnchors || []) {
    assert(testCase.fidelityPriorities.some((item) => includesInsensitive(item, anchor)), `${testCase.id}: fidelity_priorities missing "${anchor}"`);
  }
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
