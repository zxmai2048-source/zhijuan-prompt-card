import { useEffect, useMemo, useState } from 'react';
import { DEFAULT_SETTINGS, GENERATOR_SITE_IDS } from '../shared/defaults';
import { getSettings, saveSettings, getHistory } from '../shared/storage';
import type { AppSettings, HistoryEntry, RuntimeResponse } from '../shared/types';
import { HistoryView } from './HistoryView';

type ViewMode = 'home' | 'history';

export function App() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [status, setStatus] = useState('Ready');
  const [view, setView] = useState<ViewMode>('home');

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

  async function refresh() {
    setSettings(await getSettings());
    setHistory(await getHistory());
  }

  async function saveCurrentSettings() {
    const next = await saveSettings(settings);
    setSettings(next);
    setStatus('Saved');
  }

  async function testConnection() {
    await saveCurrentSettings();
    setStatus('Testing');
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

  async function startSelection() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab.id) return;
    await chrome.tabs.sendMessage(tab.id, { type: 'START_SELECTION' });
    window.close();
  }

  if (view === 'history') {
    return <HistoryView entries={history} onBack={() => setView('home')} onRefresh={() => void refresh()} />;
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <p>Zhijuan Prompt Card</p>
          <h1>Local image prompt analysis</h1>
        </div>
        <span className="status-pill">{settings.model}</span>
      </header>

      <section className="status-card">
        <span>Local API</span>
        <strong>{apiHost}</strong>
        <p>{status}</p>
      </section>

      <section className="quick-grid">
        <button type="button" className="primary" onClick={() => void startSelection()}>
          Analyze screenshot
        </button>
        <button type="button" onClick={() => setView('history')}>
          History
        </button>
        <button type="button" onClick={() => chrome.runtime.openOptionsPage()}>
          Settings
        </button>
      </section>

      <section className="settings-card">
        <label>
          Base URL
          <input value={settings.baseUrl} onChange={(event) => setSettings({ ...settings, baseUrl: event.target.value })} />
        </label>
        <label>
          API Key
          <input
            value={settings.apiKey}
            type="password"
            onChange={(event) => setSettings({ ...settings, apiKey: event.target.value })}
          />
        </label>
        <label>
          Model
          <input value={settings.model} onChange={(event) => setSettings({ ...settings, model: event.target.value })} />
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
        <button type="button" className="primary wide" onClick={() => void testConnection()}>
          Save and test
        </button>
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
