import { useEffect, useState } from 'react';
import { DEFAULT_SETTINGS, GENERATOR_SITE_IDS } from '../shared/defaults';
import { GENERATOR_SITES } from '../shared/generators';
import { getSettings, saveSettings } from '../shared/storage';
import type { AppSettings, InterfaceLanguage, RuntimeResponse } from '../shared/types';

const optionsCopy = {
  en: {
    title: 'Zhijuan Prompt',
    settings: 'API Settings',
    subtitle: 'Connection and generator defaults live here, away from the daily popup.',
    ready: 'Ready',
    saved: 'Saved',
    testing: 'Testing',
    enabled: 'Enabled',
    endpointSection: 'Endpoint',
    endpointBody: 'The extension sends selected images only to this API endpoint.',
    generationSection: 'Generation',
    generationBody: 'Model and destination used after a prompt is produced.',
    interfaceSection: 'Interface',
    interfaceBody: 'Language and extension state.',
    baseUrl: 'Base URL',
    apiKey: 'API Key',
    model: 'Model',
    language: 'Interface language',
    defaultGenerator: 'Default generator',
    save: 'Save',
    saveAndTest: 'Save and test',
    footer: 'Images are sent only to the configured API endpoint. API key stays in chrome.storage.local.',
    privacy: 'Privacy boundary',
    privacyBody: 'No account, no analytics, no extension cloud. Page images are analyzed only after you pick an image or capture a region.',
    permissions: 'Permission posture',
    permissionsBody: 'Content script is used for the floating panel, activeTab for capture, storage for local settings and history, clipboardWrite for copy actions.'
  },
  zh: {
    title: 'Zhijuan Prompt',
    settings: 'API 设置',
    subtitle: '连接、模型、默认生成器放在这里，日常弹窗只保留操作入口。',
    ready: '准备就绪',
    saved: '已保存',
    testing: '测试中',
    enabled: '启用',
    endpointSection: '连接端点',
    endpointBody: '插件只会把你主动选择的图片发送到这个 API 端点。',
    generationSection: '生成配置',
    generationBody: '识别完成后默认使用的模型与生成器入口。',
    interfaceSection: '界面',
    interfaceBody: '语言和扩展启用状态。',
    baseUrl: 'Base URL',
    apiKey: 'API Key',
    model: 'Model',
    language: '界面语言',
    defaultGenerator: '默认生成器',
    save: '保存',
    saveAndTest: '保存并测试',
    footer: '图片只发送到你配置的 API 端点，API Key 保存在 chrome.storage.local。',
    privacy: '隐私边界',
    privacyBody: '无账号、无统计、无扩展云端。只有你主动选择图片或截取区域后才会分析页面图片。',
    permissions: '权限说明',
    permissionsBody: 'content script 用于浮动面板，activeTab 用于截图，storage 用于本地设置和历史，clipboardWrite 用于复制。'
  }
} as const;

export function OptionsApp() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [status, setStatus] = useState<string>(optionsCopy.zh.ready);
  const language = normalizeLanguage(settings.interfaceLanguage);
  const labels = optionsCopy[language];

  useEffect(() => {
    void getSettings().then((next) => {
      setSettings(next);
      setStatus(optionsCopy[normalizeLanguage(next.interfaceLanguage)].ready);
    });
  }, []);

  async function save() {
    const next = await saveSettings(settings);
    setSettings(next);
    setStatus(optionsCopy[normalizeLanguage(next.interfaceLanguage)].saved);
  }

  async function test() {
    await save();
    setStatus(labels.testing);
    try {
      const result = await sendRuntimeMessage<{ schema: boolean; message: string }>({ type: 'TEST_CONNECTION', payload: settings });
      setStatus(result.message);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : String(error));
    }
  }

  return (
    <main className="options-shell">
      <aside className="settings-rail">
        <div className="rail-brand">
          <p>{labels.title}</p>
          <h1>{labels.settings}</h1>
        </div>
        <nav aria-label={labels.settings}>
          <span className="is-active">01 {labels.endpointSection}</span>
          <span>02 {labels.generationSection}</span>
          <span>03 {labels.interfaceSection}</span>
          <span>04 {labels.privacy}</span>
        </nav>
        <div className="rail-status">
          <span>{labels.ready}</span>
          <strong>{status}</strong>
        </div>
      </aside>

      <section className="settings-workbench">
        <header className="workbench-head">
          <div>
            <p>{labels.title}</p>
            <h1>{labels.settings}</h1>
            <small>{labels.subtitle}</small>
          </div>
          <span>{status}</span>
        </header>

        <div className="settings-section settings-section--endpoint">
          <div className="section-copy">
            <span>01</span>
            <h2>{labels.endpointSection}</h2>
            <p>{labels.endpointBody}</p>
          </div>
          <div className="field-grid">
            <label>
              {labels.baseUrl}
              <input value={settings.baseUrl} onChange={(event) => setSettings({ ...settings, baseUrl: event.target.value })} />
            </label>
            <label>
              {labels.apiKey}
              <input
                type="password"
                value={settings.apiKey}
                onChange={(event) => setSettings({ ...settings, apiKey: event.target.value })}
              />
            </label>
          </div>
        </div>

        <div className="settings-section">
          <div className="section-copy">
            <span>02</span>
            <h2>{labels.generationSection}</h2>
            <p>{labels.generationBody}</p>
          </div>
          <div className="field-grid">
            <label>
              {labels.model}
              <input value={settings.model} onChange={(event) => setSettings({ ...settings, model: event.target.value })} />
            </label>
            <label>
              {labels.defaultGenerator}
              <select
                value={settings.defaultGeneratorSite}
                onChange={(event) =>
                  setSettings({ ...settings, defaultGeneratorSite: event.target.value as AppSettings['defaultGeneratorSite'] })
                }
              >
                {GENERATOR_SITE_IDS.map((site) => (
                  <option key={site} value={site}>
                    {GENERATOR_SITES[site].label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="settings-section settings-section--compact">
          <div className="section-copy">
            <span>03</span>
            <h2>{labels.interfaceSection}</h2>
            <p>{labels.interfaceBody}</p>
          </div>
          <div className="field-grid">
            <label>
              {labels.language}
              <select
                value={settings.interfaceLanguage}
                onChange={(event) => setSettings({ ...settings, interfaceLanguage: event.target.value as AppSettings['interfaceLanguage'] })}
              >
                <option value="zh">中文</option>
                <option value="en">English</option>
                <option value="ja">日本語</option>
              </select>
            </label>
            <label className="toggle-row">
              <span>{labels.enabled}</span>
              <input
                type="checkbox"
                checked={settings.enabled}
                onChange={(event) => setSettings({ ...settings, enabled: event.target.checked })}
              />
            </label>
          </div>
        </div>

        <div className="button-row">
          <button type="button" onClick={() => void save()}>
            {labels.save}
          </button>
          <button type="button" className="primary" onClick={() => void test()}>
            {labels.saveAndTest}
          </button>
        </div>

        <footer>{labels.footer}</footer>
      </section>

      <aside className="trust-panel" aria-label={labels.privacy}>
        <article>
          <span>01</span>
          <h2>{labels.privacy}</h2>
          <p>{labels.privacyBody}</p>
        </article>
        <article>
          <span>02</span>
          <h2>{labels.permissions}</h2>
          <p>{labels.permissionsBody}</p>
        </article>
      </aside>
    </main>
  );
}

function normalizeLanguage(language: InterfaceLanguage) {
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
