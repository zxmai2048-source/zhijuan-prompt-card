export type InterfaceLanguage = 'zh' | 'en' | 'ja';

export type GeneratorSite = 'chatgpt' | 'codex' | 'jimeng' | 'gemini' | 'midjourney' | 'lovart';

export type AnalysisPhase = 'reading_image' | 'capturing_region' | 'preparing_image' | 'requesting_model' | 'parsing_result';

export interface AppSettings {
  enabled: boolean;
  baseUrl: string;
  apiKey: string;
  model: string;
  interfaceLanguage: InterfaceLanguage;
  defaultGeneratorSite: GeneratorSite;
  persistentFloatingButton: boolean;
}

export interface PromptAnalysis {
  zh: { prompt: string; analysis: string };
  en: { prompt: string; analysis: string };
  ja: { prompt: string; analysis: string };
  zh_style_tags: string[];
  en_style_tags: string[];
  ja_style_tags: string[];
  json_prompt: {
    subject: string;
    action_pose: string;
    details_appearance: string;
    environment_background: string;
    lighting_atmosphere: string;
    composition_framing: string;
    style_camera: string;
    colors: string[];
    materials: string[];
    aspect_ratio: string;
    quality_modifiers: string[];
    likely_generation_intent: string;
  };
  recreation_prompt: string;
  prompt_core: string;
  negative_prompt: string;
}

export interface HistoryEntry {
  id: string;
  createdAt: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  pageUrl?: string;
  title: string;
  favorite: boolean;
  analysis?: PromptAnalysis;
  status: 'success' | 'failed' | 'running' | 'canceled';
  error?: string;
}

export interface ImageTarget {
  srcUrl?: string;
  dataUrl?: string;
  pageUrl?: string;
  title?: string;
  kind: 'image' | 'page' | 'selection' | 'local';
}

export interface RuntimeResponse<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
}

export type PanelTab = 'en' | 'zh' | 'json' | 'negative';
