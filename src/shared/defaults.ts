import type { AppSettings, GeneratorSite } from './types';

export const DEFAULT_BASE_URL = 'http://127.0.0.1:8876/accounts/7e517757-60eb-4e9d-8e3a-1ad7d6731dea/v1';
export const DEFAULT_API_KEY = 'dummy';
export const DEFAULT_MODEL = 'gpt-5.5';
export const HISTORY_LIMIT = 120;

export const DEFAULT_SETTINGS: AppSettings = {
  enabled: true,
  baseUrl: DEFAULT_BASE_URL,
  apiKey: DEFAULT_API_KEY,
  model: DEFAULT_MODEL,
  interfaceLanguage: 'zh',
  defaultGeneratorSite: 'jimeng'
};

export const STORAGE_KEYS = {
  settings: 'zhijuan.settings',
  history: 'zhijuan.history'
} as const;

export const GENERATOR_SITE_IDS: GeneratorSite[] = ['jimeng', 'gemini', 'midjourney', 'lovart'];
