import type { HistoryEntry, InterfaceLanguage } from './types';

export type HistoryDisplayLanguage = 'zh' | 'en';

export function normalizeHistoryLanguage(language: InterfaceLanguage): HistoryDisplayLanguage {
  return language === 'zh' ? 'zh' : 'en';
}

export function getHistoryPrompt(entry: HistoryEntry, language: InterfaceLanguage | HistoryDisplayLanguage = 'en'): string {
  const preferred = normalizeHistoryLanguage(language as InterfaceLanguage);
  return (
    entry.analysis?.recreation_prompt ||
    entry.analysis?.[preferred]?.prompt ||
    entry.analysis?.en.prompt ||
    entry.analysis?.zh.prompt ||
    entry.analysis?.ja.prompt ||
    ''
  );
}

export function getHistoryPreviewText(entry: HistoryEntry, language: InterfaceLanguage | HistoryDisplayLanguage = 'en'): string {
  const prompt = getHistoryPrompt(entry, language);
  if (prompt) return prompt;
  if (entry.error) return entry.error;
  if (entry.status === 'running') return normalizeHistoryLanguage(language as InterfaceLanguage) === 'zh' ? '正在生成提示词。' : 'Prompt generation is running.';
  if (entry.status === 'canceled') return normalizeHistoryLanguage(language as InterfaceLanguage) === 'zh' ? '已取消。' : 'Canceled.';
  return entry.title || (normalizeHistoryLanguage(language as InterfaceLanguage) === 'zh' ? '无标题记录' : 'Untitled record');
}

export function getHistoryImageSrc(entry: HistoryEntry): string {
  return entry.thumbnailUrl || entry.imageUrl || '';
}

export function canShowHistoryImage(entry: HistoryEntry, imageSrc = getHistoryImageSrc(entry)): boolean {
  return entry.status === 'success' && Boolean(imageSrc);
}

export function getHistoryImageKey(entry: HistoryEntry, imageSrc = getHistoryImageSrc(entry)): string {
  if (!imageSrc) return `${entry.id}:missing`;
  return `${entry.id}:${imageSrc.length}:${imageSrc.slice(0, 32)}`;
}

export function getHistorySource(entry: HistoryEntry): string | undefined {
  return entry.imageUrl || entry.pageUrl;
}

export function getHistoryStatusLabel(status: HistoryEntry['status'], language: InterfaceLanguage | HistoryDisplayLanguage): string {
  if (normalizeHistoryLanguage(language as InterfaceLanguage) !== 'zh') return status;
  if (status === 'success') return '成功';
  if (status === 'failed') return '失败';
  if (status === 'running') return '运行中';
  return '已取消';
}

export function getVisualHistoryEntries(entries: HistoryEntry[], limit = 8): HistoryEntry[] {
  const withImages: HistoryEntry[] = [];
  const withoutImages: HistoryEntry[] = [];
  entries.forEach((entry) => {
    if (canShowHistoryImage(entry)) {
      withImages.push(entry);
    } else {
      withoutImages.push(entry);
    }
  });
  return [...withImages, ...withoutImages].slice(0, limit);
}
