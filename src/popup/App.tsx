import { useEffect, useMemo, useState } from 'react';
import { DEFAULT_SETTINGS } from '../shared/defaults';
import { GENERATOR_SITES } from '../shared/generators';
import { getSettings, saveSettings, getHistory } from '../shared/storage';
import type { AppSettings, HistoryEntry, InterfaceLanguage, RuntimeResponse } from '../shared/types';
import { HistoryView } from './HistoryView';

type ViewMode = 'home' | 'history';
type UiLanguage = 'zh' | 'en';

const popupCopy = {
  en: {
    title: 'Zhijuan Prompt',
    subtitle: 'Image prompt workbench',
    ready: 'Ready',
    saved: 'Saved',
    testing: 'Testing',
    localApi: 'Local API',
    pickImage: 'Pick page image',
    captureArea: 'Capture region',
    pickHint: 'Click an image, then read the prompt in the floating panel.',
    captureHint: 'Drag a screen region, then inspect the generated prompt.',
    resultPanel: 'Result panel',
    resultPanelBody: 'Floating panel',
    history: 'History',
    settings: 'Settings',
    model: 'Model',
    generator: 'Generator',
    testConnection: 'Test',
    apiSettings: 'API settings',
    activeTab: 'Current tab',
    storage: 'Local',
    entries: 'entries'
  },
  zh: {
    title: 'Zhijuan Prompt',
    subtitle: '图片提示词工作台',
    ready: '准备就绪',
    saved: '已保存',
    testing: '测试中',
    localApi: '本地 API',
    pickImage: '选择网页图片',
    captureArea: '截取屏幕区域',
    pickHint: '点击页面图片，提示词会在浮动面板里生成。',
    captureHint: '拖拽框选区域，结果同样回到浮动面板。',
    resultPanel: '结果面板',
    resultPanelBody: '右侧浮动面板',
    history: '历史',
    settings: '设置',
    model: 'Model',
    generator: '生成器',
    testConnection: '测试',
    apiSettings: 'API 设置',
    activeTab: '当前标签页',
    storage: '本地',
    entries: '条'
  }
} as const;

export function App() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [status, setStatus] = useState<string>(popupCopy.zh.ready);
  const [view, setView] = useState<ViewMode>('home');
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
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab.id) return;
    void chrome.tabs.sendMessage(tab.id, { type }).catch(() => undefined);
    window.close();
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
      <header className="app-header">
        <div>
          <p>{labels.title}</p>
          <h1>{labels.subtitle}</h1>
        </div>
        <span className="status-pill">{settings.model}</span>
      </header>

      <section className="language-row" aria-label="Language">
        <button className={language === 'zh' ? 'is-active' : ''} type="button" onClick={() => void changeLanguage('zh')}>
          中文
        </button>
        <button className={language === 'en' ? 'is-active' : ''} type="button" onClick={() => void changeLanguage('en')}>
          English
        </button>
      </section>

      <section className="status-card">
        <div className="status-card__top">
          <div>
            <span>{labels.localApi}</span>
            <strong>{apiHost}</strong>
          </div>
          <button type="button" onClick={() => void testConnection()}>
            {labels.testConnection}
          </button>
        </div>
        <p>{status}</p>
        <div className="meta-row">
          <span>{labels.model}: {settings.model}</span>
          <span>{labels.generator}: {generatorLabel}</span>
        </div>
      </section>

      <section className="action-card">
        <button type="button" className="primary action-button" onClick={() => void sendActiveTabCommand('START_IMAGE_PICK')}>
          <strong>{labels.pickImage}</strong>
          <span>{labels.pickHint}</span>
        </button>
        <button type="button" className="action-button" onClick={() => void sendActiveTabCommand('START_SELECTION')}>
          <strong>{labels.captureArea}</strong>
          <span>{labels.captureHint}</span>
        </button>
      </section>

      <section className="quick-grid">
        <button type="button" onClick={() => setView('history')}>
          {labels.history} · {history.length}
        </button>
        <button type="button" onClick={() => chrome.runtime.openOptionsPage()}>
          {labels.apiSettings}
        </button>
      </section>

      <section className="dock-card">
        <span>{labels.resultPanel}</span>
        <strong>{labels.resultPanelBody}</strong>
        <em>{labels.activeTab} · {labels.storage}</em>
      </section>
    </main>
  );
}

function normalizeLanguage(language: InterfaceLanguage): UiLanguage {
  return language === 'zh' ? 'zh' : 'en';
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
