import { useEffect, useState } from 'react';
import { DEFAULT_SETTINGS, GENERATOR_SITE_IDS } from '../shared/defaults';
import { getSettings, saveSettings } from '../shared/storage';
import type { AppSettings, RuntimeResponse } from '../shared/types';

export function OptionsApp() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [status, setStatus] = useState('Ready');

  useEffect(() => {
    void getSettings().then(setSettings);
  }, []);

  async function save() {
    setSettings(await saveSettings(settings));
    setStatus('Saved');
  }

  async function test() {
    await save();
    setStatus('Testing');
    try {
      const result = await sendRuntimeMessage<{ schema: boolean; message: string }>({ type: 'TEST_CONNECTION', payload: settings });
      setStatus(result.message);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : String(error));
    }
  }

  return (
    <main className="options-shell">
      <section className="settings-panel">
        <header>
          <p>Zhijuan Prompt Card</p>
          <h1>Settings</h1>
          <span>{status}</span>
        </header>

        <label>
          Enabled
          <input
            type="checkbox"
            checked={settings.enabled}
            onChange={(event) => setSettings({ ...settings, enabled: event.target.checked })}
          />
        </label>
        <label>
          Base URL
          <input value={settings.baseUrl} onChange={(event) => setSettings({ ...settings, baseUrl: event.target.value })} />
        </label>
        <label>
          API Key
          <input
            type="password"
            value={settings.apiKey}
            onChange={(event) => setSettings({ ...settings, apiKey: event.target.value })}
          />
        </label>
        <label>
          Model
          <input value={settings.model} onChange={(event) => setSettings({ ...settings, model: event.target.value })} />
        </label>
        <label>
          Interface language
          <select
            value={settings.interfaceLanguage}
            onChange={(event) => setSettings({ ...settings, interfaceLanguage: event.target.value as AppSettings['interfaceLanguage'] })}
          >
            <option value="zh">中文</option>
            <option value="en">English</option>
            <option value="ja">日本語</option>
          </select>
        </label>
        <label>
          Default generator
          <select
            value={settings.defaultGeneratorSite}
            onChange={(event) =>
              setSettings({ ...settings, defaultGeneratorSite: event.target.value as AppSettings['defaultGeneratorSite'] })
            }
          >
            {GENERATOR_SITE_IDS.map((site) => (
              <option key={site} value={site}>
                {site}
              </option>
            ))}
          </select>
        </label>

        <div className="button-row">
          <button type="button" onClick={() => void save()}>
            Save
          </button>
          <button type="button" className="primary" onClick={() => void test()}>
            Save and test
          </button>
        </div>

        <footer>Images are sent only to the configured API endpoint. API key stays in chrome.storage.local.</footer>
      </section>
    </main>
  );
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
