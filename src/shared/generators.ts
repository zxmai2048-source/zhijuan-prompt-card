import type { GeneratorSite } from './types';

export interface GeneratorDefinition {
  id: GeneratorSite;
  label: string;
  url: string;
  promptSelectors: string[];
}

export const GENERATOR_SITES: Record<GeneratorSite, GeneratorDefinition> = {
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
