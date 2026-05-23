import { type DragEvent as ReactDragEvent, type ChangeEvent as ReactChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
import { DEFAULT_SETTINGS } from '../shared/defaults';
import { GENERATOR_SITES } from '../shared/generators';
import { fileToDataUrl, isImageFile } from '../shared/imageData';
import { getSettings, saveSettings, getHistory } from '../shared/storage';
import type { AppSettings, HistoryEntry, InterfaceLanguage, RuntimeResponse } from '../shared/types';
import { HistoryView } from './HistoryView';

type ViewMode = 'home' | 'history';
type UiLanguage = 'zh' | 'en';

const popupCopy = {
  en: {
    title: 'Zhijuan Prompt',
    subtitle: 'Image source',
    ready: 'Ready',
    saved: 'Saved',
    testing: 'Testing',
    localApi: 'Local API',
    pickImage: 'Pick image',
    captureArea: 'Capture',
    localFile: 'Local',
    pickHint: 'Selected image enters the lens.',
    captureHint: 'Captured region enters the result lens.',
    dropHint: 'Drop local image here',
    dropActive: 'Release to analyze',
    invalidFile: 'Only image files are supported.',
    resultPanel: 'Result lens',
    resultPanelBody: 'Source preview and prompt output',
    history: 'History',
    settings: 'Settings',
    test: 'Test',
    model: 'Model',
    generator: 'Generator',
    testConnection: 'Test API',
    apiSettings: 'API settings',
    activeTab: 'Current tab',
    storage: 'Local',
    entries: 'entries',
    actionHint: 'Choose an image, then read the prompt.',
    dockLabel: 'Local workflow'
  },
  zh: {
    title: 'Zhijuan Prompt',
    subtitle: '图片源',
    ready: '准备就绪',
    saved: '已保存',
    testing: '测试中',
    localApi: '本地 API',
    pickImage: '选图识别',
    captureArea: '框选',
    localFile: '本地',
    pickHint: '选图后进入结果镜头。',
    captureHint: '截取区域会进入结果镜头。',
    dropHint: '本地图片拖到这里',
    dropActive: '松手识别',
    invalidFile: '只支持图片文件。',
    resultPanel: '结果镜头',
    resultPanelBody: '源图预览 + 提示词输出',
    history: '历史',
    settings: '设置',
    test: '测试',
    model: 'Model',
    generator: '生成器',
    testConnection: '测试 API',
    apiSettings: 'API 设置',
    activeTab: '当前标签页',
    storage: '本地',
    entries: '条',
    actionHint: '先选图片，再读提示词。',
    dockLabel: '本地流程'
  }
} as const;

export function App() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [status, setStatus] = useState<string>(popupCopy.zh.ready);
  const [view, setView] = useState<ViewMode>('home');
  const [fileDragActive, setFileDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const language = normalizeLanguage(settings.interfaceLanguage);
  const labels = popupCopy[language];

  useEffect(() => {
    void refresh();
  }, []);

  const apiHost = useMemo(() => {
    try {
      return new URL(settings.baseUrl).host;
    } catch {
      return settings.baseUrl;
    }
  }, [settings.baseUrl]);
  const generatorLabel = GENERATOR_SITES[settings.defaultGeneratorSite]?.label || settings.defaultGeneratorSite;

  async function refresh() {
    const nextSettings = await getSettings();
    setSettings(nextSettings);
    setStatus(popupCopy[normalizeLanguage(nextSettings.interfaceLanguage)].ready);
    setHistory(await getHistory());
  }

  async function testConnection() {
    setStatus(labels.testing);
    try {
      const result = await sendRuntimeMessage<{ schema: boolean; message: string }>({
        type: 'TEST_CONNECTION',
        payload: settings
      });
      setStatus(result.message);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : String(error));
    }
  }

  async function sendActiveTabCommand(type: 'START_SELECTION' | 'START_IMAGE_PICK') {
    const tab = await getActivePageTab();
    if (!tab?.id) {
      setStatus(labels.activeTab);
      return;
    }
    chrome.runtime.sendMessage({ type: 'DISPATCH_TAB_COMMAND', payload: { command: type, tabId: tab.id } }, () => undefined);
    window.close();
  }

  async function analyzeLocalFile(file: File | undefined) {
    if (!file) return;
    if (!isImageFile(file)) {
      setStatus(labels.invalidFile);
      return;
    }
    setStatus(labels.testing);
    try {
      const dataUrl = await fileToDataUrl(file);
      await sendRuntimeMessage({
        type: 'RUN_ANALYSIS',
        payload: {
          target: {
            kind: 'local',
            dataUrl,
            title: file.name,
            pageUrl: `local-file:${file.name}`
          }
        }
      });
      setStatus(labels.saved);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : String(error));
    }
  }

  function handleFileChange(event: ReactChangeEvent<HTMLInputElement>) {
    void analyzeLocalFile(firstImageFile(event.currentTarget.files));
    event.currentTarget.value = '';
  }

  function handleFileDrag(event: ReactDragEvent<HTMLElement>) {
    if (!hasFileDrag(event.dataTransfer)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
    setFileDragActive(true);
  }

  function handleFileDragLeave(event: ReactDragEvent<HTMLElement>) {
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
    setFileDragActive(false);
  }

  function handleFileDrop(event: ReactDragEvent<HTMLElement>) {
    if (!hasFileDrag(event.dataTransfer)) return;
    event.preventDefault();
    setFileDragActive(false);
    void analyzeLocalFile(firstImageFile(event.dataTransfer.files));
  }

  async function changeLanguage(interfaceLanguage: InterfaceLanguage) {
    const next = await saveSettings({ ...settings, interfaceLanguage });
    setSettings(next);
    setStatus(popupCopy[normalizeLanguage(interfaceLanguage)].saved);
  }

  if (view === 'history') {
    return <HistoryView entries={history} language={language} onBack={() => setView('home')} onRefresh={() => void refresh()} />;
  }

  return (
    <main className="app-shell">
      <input ref={fileInputRef} className="file-input" type="file" accept="image/*" onChange={handleFileChange} />
      <header className="microbar">
        <div className="brand">
          <p>{labels.title}</p>
          <h1>{labels.subtitle}</h1>
        </div>
        <div className="language-pills" aria-label="Language">
          <button className={language === 'zh' ? 'is-active' : ''} type="button" onClick={() => void changeLanguage('zh')}>
            中
          </button>
          <button className={language === 'en' ? 'is-active' : ''} type="button" onClick={() => void changeLanguage('en')}>
            EN
          </button>
        </div>
      </header>

      <section
        className={fileDragActive ? 'command-puck is-drop-active' : 'command-puck'}
        aria-label={labels.dockLabel}
        onDragEnter={handleFileDrag}
        onDragOver={handleFileDrag}
        onDragLeave={handleFileDragLeave}
        onDrop={handleFileDrop}
      >
        <button type="button" className="orbit-action orbit-action--secondary" onClick={() => void sendActiveTabCommand('START_SELECTION')}>
          <IconCrop />
          <span>{labels.captureArea}</span>
        </button>
        <div className="puck-core">
          <span>{labels.subtitle}</span>
          <strong>{fileDragActive ? labels.dropActive : labels.dropHint}</strong>
        </div>
        <button type="button" className="orbit-action orbit-action--primary" onClick={() => void sendActiveTabCommand('START_IMAGE_PICK')}>
          <IconImage />
          <span>{labels.pickImage}</span>
        </button>
      </section>

      <section className="signal-strip">
        <button className="signal-card" type="button" onClick={() => void testConnection()}>
          <span>{labels.localApi}</span>
          <strong>{apiHost}</strong>
          <em>{status}</em>
        </button>
        <div className="signal-card">
          <span>{labels.resultPanel}</span>
          <strong>{labels.resultPanelBody}</strong>
          <em>{labels.model}: {settings.model}</em>
        </div>
      </section>

      <section className="utility-dock" aria-label={labels.dockLabel}>
        <button type="button" onClick={() => setView('history')} aria-label={labels.history}>
          <IconHistory />
          <span>{history.length}</span>
        </button>
        <button type="button" onClick={() => fileInputRef.current?.click()}>
          <IconUpload />
          <span>{labels.localFile}</span>
        </button>
        <button type="button" onClick={() => chrome.runtime.openOptionsPage()}>
          <IconSettings />
          <span>{labels.settings}</span>
        </button>
        <button type="button" onClick={() => void testConnection()}>
          <IconPulse />
          <span>{generatorLabel}</span>
        </button>
      </section>
    </main>
  );
}

function firstImageFile(files: FileList | null): File | undefined {
  if (!files) return undefined;
  return [...files].find(isImageFile);
}

function hasFileDrag(dataTransfer: DataTransfer): boolean {
  return [...dataTransfer.types].includes('Files');
}

function normalizeLanguage(language: InterfaceLanguage): UiLanguage {
  return language === 'zh' ? 'zh' : 'en';
}

async function getActivePageTab(): Promise<chrome.tabs.Tab | undefined> {
  const [currentWindowTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (isPageTab(currentWindowTab)) return currentWindowTab;

  const [lastFocusedTab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  if (isPageTab(lastFocusedTab)) return lastFocusedTab;

  const activeTabs = await chrome.tabs.query({ active: true });
  return activeTabs.find(isPageTab);
}

function isPageTab(tab: chrome.tabs.Tab | undefined): tab is chrome.tabs.Tab {
  if (!tab?.id) return false;
  const url = tab.url || tab.pendingUrl || '';
  return /^https?:\/\//.test(url) || /^file:\/\//.test(url);
}

function sendRuntimeMessage<T>(message: unknown): Promise<T> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response: RuntimeResponse<T>) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      if (!response?.ok) reject(new Error(response?.error || 'Request failed.'));
      else resolve(response.data as T);
    });
  });
}

function IconImage() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5.8 7.4c0-1 .8-1.8 1.8-1.8h8.8c1 0 1.8.8 1.8 1.8v9.2c0 1-.8 1.8-1.8 1.8H7.6c-1 0-1.8-.8-1.8-1.8V7.4Z" />
      <path d="m7.2 16 3.3-3.2 2 1.9 1.3-1.4 3 2.7" />
      <path d="M14.9 9.1h.1" />
    </svg>
  );
}

function IconCrop() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 3.8v11.4c0 1 .8 1.8 1.8 1.8h11.4" />
      <path d="M3.8 7H15c1.1 0 2 .9 2 2v11.2" />
    </svg>
  );
}

function IconUpload() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 16V4.8" />
      <path d="m7.6 9.2 4.4-4.4 4.4 4.4" />
      <path d="M5.2 15.2v2.6c0 .9.7 1.6 1.6 1.6h10.4c.9 0 1.6-.7 1.6-1.6v-2.6" />
    </svg>
  );
}

function IconHistory() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5.5 5.6h13M5.5 12h13M5.5 18.4h8.8" />
      <path d="M4.8 4.4v15.2" />
    </svg>
  );
}

function IconSettings() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 8.4a3.6 3.6 0 1 0 0 7.2 3.6 3.6 0 0 0 0-7.2Z" />
      <path d="m18.7 14 .1-2-.1-2 1.7-1.2-1.8-3.1-2 .8a7.7 7.7 0 0 0-1.7-1l-.3-2.1h-5.2l-.3 2.1a7.7 7.7 0 0 0-1.7 1l-2-.8-1.8 3.1L5.3 10a7.8 7.8 0 0 0-.1 2l.1 2-1.7 1.2 1.8 3.1 2-.8c.5.4 1.1.7 1.7 1l.3 2.1h5.2l.3-2.1c.6-.3 1.2-.6 1.7-1l2 .8 1.8-3.1L18.7 14Z" />
    </svg>
  );
}

function IconPulse() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 12h3.2l2-5.3 4 10.6 2.4-5.3H20" />
    </svg>
  );
}
