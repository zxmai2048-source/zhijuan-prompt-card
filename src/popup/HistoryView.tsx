import { clearHistory, deleteHistoryEntry, getHistory, updateHistoryEntry } from '../shared/storage';
import type { HistoryEntry } from '../shared/types';

export function HistoryView(props: { entries: HistoryEntry[]; onBack: () => void; onRefresh: () => void }) {
  async function copy(text: string) {
    await navigator.clipboard.writeText(text);
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
    props.onRefresh();
  }

  async function refresh() {
    await getHistory();
    props.onRefresh();
  }

  return (
    <main className="app-shell">
      <header className="app-header compact">
        <button type="button" onClick={props.onBack}>
          Back
        </button>
        <div>
          <p>History</p>
          <h1>{props.entries.length} local entries</h1>
        </div>
      </header>

      <div className="quick-grid two">
        <button type="button" onClick={() => void refresh()}>
          Refresh
        </button>
        <button type="button" onClick={() => void clearAll()}>
          Clear all
        </button>
      </div>

      <section className="history-list">
        {props.entries.map((entry) => (
          <article className="history-item" key={entry.id}>
            <div className="history-item__top">
              <strong>{entry.title}</strong>
              <span className={entry.status}>{entry.status}</span>
            </div>
            <p>{new Date(entry.createdAt).toLocaleString()}</p>
            {entry.error ? <p className="error-text">{entry.error}</p> : null}
            <div className="history-actions">
              <button
                type="button"
                disabled={!entry.analysis}
                onClick={() => entry.analysis && void copy(entry.analysis.recreation_prompt)}
              >
                Copy prompt
              </button>
              <button type="button" disabled={!entry.analysis} onClick={() => entry.analysis && void copy(JSON.stringify(entry.analysis, null, 2))}>
                Copy JSON
              </button>
              <button type="button" onClick={() => void toggle(entry)}>
                {entry.favorite ? 'Saved' : 'Save'}
              </button>
              <button type="button" onClick={() => void remove(entry.id)}>
                Delete
              </button>
            </div>
          </article>
        ))}
        {!props.entries.length ? <div className="empty-state">No history yet</div> : null}
      </section>
    </main>
  );
}
