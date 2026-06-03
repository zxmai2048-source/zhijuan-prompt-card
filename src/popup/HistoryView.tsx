import { useEffect, useState } from 'react';
import { clearHistory, deleteHistoryEntry, getHistory, updateHistoryEntry } from '../shared/storage';
import type { HistoryEntry, InterfaceLanguage } from '../shared/types';

const historyCopy = {
  en: {
    back: 'Back',
    history: 'Local records',
    localEntries: 'local entries',
    refresh: 'Refresh',
    clearAll: 'Clear local records',
    copyPrompt: 'Copy prompt',
    copyJson: 'Copy JSON',
    copySource: 'Copy source',
    openSource: 'Open source',
    promptPreview: 'Prompt',
    source: 'Source',
    storageTitle: 'Local storage',
    storageBody: 'Saved locally in chrome.storage.local: prompts, source URL, time, status, and settings. Local image files are not copied into a folder.',
    storageUsage: 'Storage used',
    copyStoragePath: 'Copy storage path',
    storagePathCopied: 'Storage path copied',
    saved: 'Saved',
    save: 'Save',
    delete: 'Delete',
    empty: 'No history yet'
  },
  zh: {
    back: '返回',
    history: '本地记录',
    localEntries: '条本地记录',
    refresh: '刷新',
    clearAll: '清空本地记录',
    copyPrompt: '复制提示词',
    copyJson: '复制 JSON',
    copySource: '复制来源',
    openSource: '打开来源',
    promptPreview: '提示词',
    source: '来源',
    storageTitle: '本地存储',
    storageBody: '保存在 chrome.storage.local：提示词、来源 URL、时间、状态和设置。本地图片不会另存成文件夹。',
    storageUsage: '存储占用',
    copyStoragePath: '复制存储路径',
    storagePathCopied: '已复制存储路径',
    saved: '已保存',
    save: '保存',
    delete: '删除',
    empty: '暂无历史'
  }
} as const;

export function HistoryView(props: { entries: HistoryEntry[]; language: InterfaceLanguage; onBack: () => void; onRefresh: () => void }) {
  const labels = historyCopy[props.language === 'zh' ? 'zh' : 'en'];
  const [notice, setNotice] = useState('');
  const [storageUsage, setStorageUsage] = useState('');

  useEffect(() => {
    void refreshStorageUsage();
  }, [props.entries.length]);

  async function copy(text: string) {
    await writeClipboardText(text);
  }

  async function remove(id: string) {
    await deleteHistoryEntry(id);
    props.onRefresh();
  }

  async function toggle(entry: HistoryEntry) {
    await updateHistoryEntry(entry.id, { favorite: !entry.favorite });
    props.onRefresh();
  }

  async function clearAll() {
    await clearHistory();
    setNotice('');
    await refreshStorageUsage();
    props.onRefresh();
  }

  async function refresh() {
    await getHistory();
    await refreshStorageUsage();
    props.onRefresh();
  }

  async function refreshStorageUsage() {
    if (!chrome.storage?.local?.getBytesInUse) {
      setStorageUsage('');
      return;
    }
    const bytes = await chrome.storage.local.getBytesInUse();
    setStorageUsage(formatBytes(bytes));
  }

  return (
    <main className="app-shell">
      <header className="app-header compact">
        <button type="button" onClick={props.onBack}>
          {labels.back}
        </button>
        <div>
          <p>{labels.history}</p>
          <h1>{props.entries.length} {labels.localEntries}</h1>
        </div>
      </header>

      <div className="quick-grid two">
        <button type="button" onClick={() => void refresh()}>
          {labels.refresh}
        </button>
        <button type="button" onClick={() => void clearAll()}>
          {labels.clearAll}
        </button>
      </div>

      <section className="storage-note">
        <strong>{labels.storageTitle}</strong>
        <p>{labels.storageBody}</p>
        {storageUsage ? <p>{labels.storageUsage}: {storageUsage}</p> : null}
        <button
          type="button"
          onClick={() => {
            void copy(getStorageLocationHint());
            setNotice(labels.storagePathCopied);
          }}
        >
          {labels.copyStoragePath}
        </button>
        {notice ? <span>{notice}</span> : null}
      </section>

      <section className="history-list">
        {props.entries.map((entry) => {
          const source = getEntrySource(entry);
          const prompt = getEntryPrompt(entry);
          return (
            <article className="history-item" key={entry.id}>
              <div className="history-item__top">
                <strong>{entry.title}</strong>
                <span className={entry.status}>{getStatusLabel(entry.status, props.language)}</span>
              </div>
              <p>{new Date(entry.createdAt).toLocaleString()}</p>
              {prompt ? (
                <div className="history-prompt-preview">
                  <div className="history-preview-head">
                    <span>{labels.promptPreview}</span>
                    <button type="button" onClick={() => void copy(prompt)}>
                      {labels.copyPrompt}
                    </button>
                  </div>
                  <p>{prompt}</p>
                </div>
              ) : null}
              {source ? (
                <p className="history-source">
                  <span>{labels.source}: </span>
                  {source}
                </p>
              ) : null}
              {entry.error ? <p className="error-text">{entry.error}</p> : null}
              <div className="history-actions">
                <button
                  type="button"
                  disabled={!entry.analysis}
                  onClick={() => entry.analysis && void copy(entry.analysis.recreation_prompt)}
                >
                  {labels.copyPrompt}
                </button>
                <button type="button" disabled={!entry.analysis} onClick={() => entry.analysis && void copy(JSON.stringify(entry.analysis, null, 2))}>
                  {labels.copyJson}
                </button>
                <button type="button" disabled={!source} onClick={() => source && void copy(source)}>
                  {labels.copySource}
                </button>
                <button type="button" disabled={!isOpenableSource(source)} onClick={() => source && void chrome.tabs.create({ url: source })}>
                  {labels.openSource}
                </button>
                <button type="button" onClick={() => void toggle(entry)}>
                  {entry.favorite ? labels.saved : labels.save}
                </button>
                <button type="button" onClick={() => void remove(entry.id)}>
                  {labels.delete}
                </button>
              </div>
            </article>
          );
        })}
        {!props.entries.length ? <div className="empty-state">{labels.empty}</div> : null}
      </section>
    </main>
  );
}

function getEntrySource(entry: HistoryEntry): string | undefined {
  return entry.imageUrl || entry.pageUrl;
}

function getEntryPrompt(entry: HistoryEntry): string | undefined {
  return entry.analysis?.recreation_prompt || entry.analysis?.en.prompt || entry.analysis?.zh.prompt;
}

function isOpenableSource(source: string | undefined): boolean {
  return Boolean(source && /^(https?:|file:|data:)/i.test(source));
}

function getStatusLabel(status: HistoryEntry['status'], language: InterfaceLanguage): string {
  if (language !== 'zh') return status;
  if (status === 'success') return '成功';
  if (status === 'failed') return '失败';
  if (status === 'running') return '运行中';
  return '已取消';
}

function getStorageLocationHint(): string {
  const extensionId = chrome.runtime.id;
  return [
    'chrome.storage.local',
    `Extension ID: ${extensionId}`,
    `macOS Chrome default profile: ~/Library/Application Support/Google/Chrome/Default/Local Extension Settings/${extensionId}`,
    '本地记录是浏览器扩展存储，不是图片文件夹；本地图片不会被插件另存。'
  ].join('\n');
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(2)} MB`;
}

async function writeClipboardText(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', 'true');
  textarea.style.cssText = 'position:fixed;top:-1000px;left:-1000px;opacity:0';
  document.documentElement.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand('copy');
  textarea.remove();
  if (!copied) throw new Error('Clipboard write failed.');
}
