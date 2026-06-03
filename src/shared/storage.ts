import { DEFAULT_SETTINGS, HISTORY_LIMIT, STORAGE_KEYS } from './defaults';
import type { AppSettings, HistoryEntry, PromptAnalysis } from './types';

type StorageRecord = Record<string, unknown>;

const memoryStorage = new Map<string, unknown>();

function hasChromeStorage(): boolean {
  return typeof chrome !== 'undefined' && Boolean(chrome.storage?.local);
}

async function readLocal<T>(keys: string[]): Promise<Record<string, T | undefined>> {
  if (!hasChromeStorage()) {
    return Object.fromEntries(keys.map((key) => [key, memoryStorage.get(key) as T | undefined]));
  }
  return chrome.storage.local.get(keys) as Promise<Record<string, T | undefined>>;
}

async function writeLocal(values: StorageRecord): Promise<void> {
  if (!hasChromeStorage()) {
    for (const [key, value] of Object.entries(values)) memoryStorage.set(key, value);
    return;
  }
  await chrome.storage.local.set(values);
}

export async function getSettings(): Promise<AppSettings> {
  const record = await readLocal<Partial<AppSettings>>([STORAGE_KEYS.settings]);
  return normalizeSettings(record[STORAGE_KEYS.settings]);
}

export async function saveSettings(settings: Partial<AppSettings>): Promise<AppSettings> {
  const merged = normalizeSettings(settings);
  await writeLocal({ [STORAGE_KEYS.settings]: merged });
  return merged;
}

export async function getHistory(): Promise<HistoryEntry[]> {
  const record = await readLocal<HistoryEntry[]>([STORAGE_KEYS.history]);
  const value = record[STORAGE_KEYS.history];
  const history: HistoryEntry[] = Array.isArray(value) ? value : [];
  return history.slice(0, HISTORY_LIMIT);
}

export async function addHistoryEntry(entry: HistoryEntry): Promise<HistoryEntry[]> {
  const history = await getHistory();
  const next = [entry, ...history.filter((item) => item.id !== entry.id)].slice(0, HISTORY_LIMIT);
  await writeLocal({ [STORAGE_KEYS.history]: next });
  return next;
}

export async function updateHistoryEntry(id: string, patch: Partial<HistoryEntry>): Promise<HistoryEntry | undefined> {
  const history = await getHistory();
  let updated: HistoryEntry | undefined;
  const next = history.map((entry) => {
    if (entry.id !== id) return entry;
    updated = { ...entry, ...patch };
    return updated;
  });
  await writeLocal({ [STORAGE_KEYS.history]: next });
  return updated;
}

export async function failRunningHistoryEntries(error = '上次识别未完成，已自动结束。'): Promise<void> {
  const history = await getHistory();
  const next = history.map((entry) => (entry.status === 'running' ? { ...entry, status: 'failed' as const, error } : entry));
  await writeLocal({ [STORAGE_KEYS.history]: next });
}

export async function compactHistoryStorage(): Promise<void> {
  const history = await getHistory();
  const next = history.map((entry) => (entry.imageUrl?.startsWith('data:') ? { ...entry, imageUrl: undefined } : entry));
  await writeLocal({ [STORAGE_KEYS.history]: next });
}

export async function deleteHistoryEntry(id: string): Promise<HistoryEntry[]> {
  const next = (await getHistory()).filter((entry) => entry.id !== id);
  await writeLocal({ [STORAGE_KEYS.history]: next });
  return next;
}

export async function clearHistory(): Promise<void> {
  await writeLocal({ [STORAGE_KEYS.history]: [] });
}

export function createRunningHistoryEntry(input: {
  imageUrl?: string;
  pageUrl?: string;
  title?: string;
}): HistoryEntry {
  return {
    id: createId(),
    createdAt: new Date().toISOString(),
    imageUrl: input.imageUrl,
    pageUrl: input.pageUrl,
    title: input.title || 'Running analysis',
    favorite: false,
    status: 'running'
  };
}

export function buildHistoryTitle(analysis?: PromptAnalysis, fallback = 'Untitled image'): string {
  const subject = analysis?.json_prompt?.subject?.trim();
  if (subject) return truncate(subject, 96);
  const prompt = analysis?.en?.prompt?.trim();
  if (prompt) return truncate(prompt, 72);
  return fallback;
}

function normalizeSettings(input?: Partial<AppSettings>): AppSettings {
  return {
    ...DEFAULT_SETTINGS,
    ...input,
    enabled: input?.enabled ?? DEFAULT_SETTINGS.enabled,
    baseUrl: input?.baseUrl?.trim() || DEFAULT_SETTINGS.baseUrl,
    apiKey: input?.apiKey ?? DEFAULT_SETTINGS.apiKey,
    model: input?.model?.trim() || DEFAULT_SETTINGS.model,
    interfaceLanguage: input?.interfaceLanguage || DEFAULT_SETTINGS.interfaceLanguage,
    defaultGeneratorSite: input?.defaultGeneratorSite || DEFAULT_SETTINGS.defaultGeneratorSite,
    persistentFloatingButton: input?.persistentFloatingButton ?? DEFAULT_SETTINGS.persistentFloatingButton
  };
}

function createId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function truncate(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max - 1)}...` : value;
}
