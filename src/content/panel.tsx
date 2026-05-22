import { useEffect, useState } from 'react';
import type { HistoryEntry, ImageTarget, PanelTab, PromptAnalysis, GeneratorSite } from '../shared/types';
import { GENERATOR_SITES } from '../shared/generators';

export interface PanelState {
  open: boolean;
  loading: boolean;
  error?: string;
  entry?: HistoryEntry;
  target?: ImageTarget;
  notice?: string;
}

export interface PanelProps {
  state: PanelState;
  onClose: () => void;
  onCopy: (text: string, label: string) => void;
  onRegenerate: () => void;
  onOpenGenerator: (siteId: GeneratorSite, prompt: string) => void;
  onToggleFavorite: (id: string, favorite: boolean) => void;
}

const loadingSteps = ['Reading the image', 'Extracting visual style', 'Building your prompt'];

export function Panel(props: PanelProps) {
  const { state } = props;
  const analysis = state.entry?.analysis;
  const activeTab = usePreferredTab(analysis);
  if (!state.open) return null;

  return (
    <section className="zpc-panel" aria-live="polite">
      <header className="zpc-panel__header">
        <div>
          <div className="zpc-kicker">Zhijuan Prompt Card</div>
          <h2>{state.loading ? 'Analyzing image' : analysis ? 'Prompt analysis' : 'Ready'}</h2>
        </div>
        <button className="zpc-icon-button" type="button" onClick={props.onClose} aria-label="Close">
          x
        </button>
      </header>

      {state.loading ? <LoadingBlock /> : null}
      {state.error ? <ErrorBlock error={state.error} /> : null}
      {analysis ? <ResultBlock analysis={analysis} activeTab={activeTab} {...props} /> : null}
      {state.notice ? <div className="zpc-toast-inline">{state.notice}</div> : null}
    </section>
  );
}

function LoadingBlock() {
  return (
    <div className="zpc-card zpc-loading">
      {loadingSteps.map((step, index) => (
        <div className="zpc-loading__row" key={step}>
          <span className={index === 2 ? 'zpc-dot zpc-dot--active' : 'zpc-dot'} />
          <span>{step}</span>
        </div>
      ))}
    </div>
  );
}

function ErrorBlock({ error }: { error: string }) {
  return (
    <div className="zpc-card zpc-error">
      <strong>Analysis failed</strong>
      <p>{error}</p>
    </div>
  );
}

function ResultBlock(
  props: PanelProps & {
    analysis: PromptAnalysis;
    activeTab: [PanelTab, (tab: PanelTab) => void];
  }
) {
  const { analysis } = props;
  const [tab, setTab] = props.activeTab;
  const tabText = getTabText(analysis, tab);
  const entryId = props.state.entry?.id;
  const favorite = Boolean(props.state.entry?.favorite);

  return (
    <>
      <div className="zpc-tabs">
        {(['en', 'zh', 'json', 'negative'] as PanelTab[]).map((item) => (
          <button className={tab === item ? 'is-active' : ''} type="button" onClick={() => setTab(item)} key={item}>
            {tabLabel(item)}
          </button>
        ))}
      </div>

      <div className="zpc-card">
        <div className="zpc-tags">{getTags(analysis, tab).map((tag) => <span key={tag}>{tag}</span>)}</div>
        <pre className="zpc-result">{tabText}</pre>
      </div>

      <div className="zpc-card zpc-core">
        <h3>Recreation prompt</h3>
        <p>{analysis.recreation_prompt}</p>
      </div>

      <div className="zpc-actions">
        <button type="button" className="zpc-primary" onClick={() => props.onCopy(analysis.recreation_prompt, 'Prompt copied')}>
          Copy
        </button>
        <button type="button" onClick={() => props.onCopy(JSON.stringify(analysis, null, 2), 'JSON copied')}>
          Copy JSON
        </button>
        <button type="button" onClick={() => props.onCopy(analysis.negative_prompt, 'Negative copied')}>
          Copy Negative
        </button>
        <button type="button" onClick={props.onRegenerate}>
          Regenerate
        </button>
        {entryId ? (
          <button type="button" onClick={() => props.onToggleFavorite(entryId, !favorite)}>
            {favorite ? 'Saved' : 'Save'}
          </button>
        ) : null}
      </div>

      <div className="zpc-generator-grid">
        {(Object.keys(GENERATOR_SITES) as GeneratorSite[]).map((siteId) => (
          <button type="button" key={siteId} onClick={() => props.onOpenGenerator(siteId, analysis.recreation_prompt)}>
            Open in {GENERATOR_SITES[siteId].label}
          </button>
        ))}
      </div>
    </>
  );
}

function usePreferredTab(analysis?: PromptAnalysis): [PanelTab, (tab: PanelTab) => void] {
  const [tab, setTab] = useState<PanelTab>('en');
  useEffect(() => {
    if (analysis) setTab('en');
  }, [analysis]);
  return [tab, setTab];
}

function getTabText(analysis: PromptAnalysis, tab: PanelTab): string {
  if (tab === 'json') return JSON.stringify(analysis.json_prompt, null, 2);
  if (tab === 'negative') return analysis.negative_prompt;
  return `${analysis[tab].prompt}\n\n${analysis[tab].analysis}`;
}

function getTags(analysis: PromptAnalysis, tab: PanelTab): string[] {
  if (tab === 'zh') return analysis.zh_style_tags;
  if (tab === 'en') return analysis.en_style_tags;
  if (tab === 'json') return analysis.json_prompt.quality_modifiers;
  return ['artifact control', 'clean anatomy', 'no text errors', 'stable detail'];
}

function tabLabel(tab: PanelTab): string {
  return tab === 'zh' ? '中文' : tab === 'json' ? 'JSON' : tab === 'negative' ? 'Negative' : 'EN';
}
