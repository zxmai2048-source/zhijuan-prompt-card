import type { GeneratorSite } from './types';

export interface GeneratorDefinition {
  id: GeneratorSite;
  label: string;
  url: string;
  promptSelectors: string[];
}

export const GENERATOR_SITES: Record<GeneratorSite, GeneratorDefinition> = {
  chatgpt: {
    id: 'chatgpt',
    label: 'ChatGPT',
    url: 'https://chatgpt.com/',
    promptSelectors: [
      '#prompt-textarea',
      '[data-testid="composer-input"]',
      "div[contenteditable='true'][role='textbox']",
      "div[contenteditable='true']",
      'textarea'
    ]
  },
  codex: {
    id: 'codex',
    label: 'Codex',
    url: 'https://chatgpt.com/codex',
    promptSelectors: [
      '#prompt-textarea',
      '[data-testid="composer-input"]',
      "div[contenteditable='true'][role='textbox']",
      "div[contenteditable='true']",
      'textarea'
    ]
  },
  jimeng: {
    id: 'jimeng',
    label: 'Jimeng',
    url: 'https://jimeng.jianying.com/',
    promptSelectors: ['textarea', "div[contenteditable='true']", "input[type='text']"]
  },
  gemini: {
    id: 'gemini',
    label: 'Gemini',
    url: 'https://gemini.google.com/app',
    promptSelectors: ['rich-textarea .ql-editor', "div[contenteditable='true'][role='textbox']", 'textarea']
  },
  midjourney: {
    id: 'midjourney',
    label: 'Midjourney',
    url: 'https://www.midjourney.com/imagine',
    promptSelectors: ['textarea', "div[contenteditable='true']", "input[type='text']"]
  },
  lovart: {
    id: 'lovart',
    label: 'Lovart',
    url: 'https://www.lovart.ai/',
    promptSelectors: ['textarea', "div[contenteditable='true']", "input[type='text']"]
  }
};

export function getGeneratorSite(siteId: GeneratorSite): GeneratorDefinition {
  return GENERATOR_SITES[siteId];
}
