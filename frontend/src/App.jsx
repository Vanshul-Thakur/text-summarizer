import { useRef, useState } from 'react';
import { summarizeText } from './api.js';
import './App.css';

const EXAMPLE = `The growth of renewable energy has accelerated worldwide as solar panels and wind turbines become more affordable. Countries are investing in clean energy to reduce greenhouse gas emissions and improve energy security. Solar energy generates electricity from sunlight, while wind turbines convert moving air into power. Both technologies depend on weather conditions, so energy storage and improved power grids are important for reliability. Researchers are developing better batteries to store surplus electricity for later use. These advances could make renewable energy more dependable and reduce reliance on fossil fuels.`;

const MAX_LENGTH = 20_000;
const countWords = (value) => value.trim() ? value.trim().split(/\s+/).length : 0;

//Icon function made by gpt
function Icon({ name, size = 20, className = '' }) {
  const shapes = {
    sparkle: <><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" /><path d="m19 16 .7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7L19 16ZM4 17l.7 1.3L6 19l-1.3.7L4 21l-.7-1.3L2 19l1.3-.7L4 17Z" /></>,
    lines: <><path d="M4 6h16M4 11h16M4 16h10" /><path d="M4 21h7" /></>,
    wand: <><path d="m4 20 16-16M15 3v4M13 5h4M6 3v3M4.5 4.5h3M19 16v5M16.5 18.5h5" /></>,
    arrow: <><path d="M4 12h16M14 6l6 6-6 6" /></>,
    copy: <><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" /></>,
    check: <path d="m4 12 5 5L20 6" />,
    info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 7h.01" /></>,
    rotate: <><path d="M20 7v5h-5M4 17v-5h5" /><path d="M5.5 9A7 7 0 0 1 18 7l2 5M4 12l2 5a7 7 0 0 0 12.5-2" /></>,
  };

  return (
    <svg aria-hidden="true" className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {shapes[name]}
    </svg>
  );
}

export default function App() {
  // Existing application state and behavior: unchanged.
  const [text, setText] = useState('');
  const [mode, setMode] = useState('extractive');
  const [summary, setSummary] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const controller = useRef(null);

  const words = countWords(text);
  const summaryWords = countWords(summary);
  const reduction = words && summaryWords ? Math.max(0, Math.round((1 - summaryWords / words) * 100)) : 0;

  async function handleSummarize(event) {
    event.preventDefault();
    if (loading) return;
    if (!text.trim()) {
      setError('Please enter some text before summarizing.');
      return;
    }
    if (text.length > MAX_LENGTH) {
      setError(`Your text exceeds the ${MAX_LENGTH.toLocaleString()} character limit.`);
      return;
    }
    const next = new AbortController();
    controller.current = next;
    setLoading(true);
    setError('');
    setSummary('');
    setCopied(false);
    try {
      const result = await summarizeText({ text: text.trim(), mode, signal: next.signal });
      if (!next.signal.aborted) setSummary(result.summary);
    } catch (err) {
      if (!next.signal.aborted) setError(err?.message || 'Could not generate summary.');
    } finally {
      if (controller.current === next) {
        controller.current = null;
        setLoading(false);
      }
    }
  }

  function clearAll() {
    controller.current?.abort();
    controller.current = null;
    setText('');
    setSummary('');
    setError('');
    setCopied(false);
    setLoading(false);
  }

  async function copySummary() {
    if (!summary) return;
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setError('Copy failed. Please select and copy the summary manually.');
    }
  }

  return (
    <div className="sk-page min-h-screen px-3 py-6 sm:px-6 sm:py-10 lg:px-10 lg:py-14">
      <main id="top" className="sk-shell mx-auto w-full max-w-[1320px] overflow-hidden">
        {/* Leather-like header */}
        <header className="sk-header flex flex-col gap-2 px-6 py-7 sm:px-10 lg:flex-row lg:items-center lg:gap-10 lg:px-14 lg:py-9">
          <h1 className="sk-title shrink-0">Text Summarizer</h1>
          <span className="sk-header-divider hidden lg:block" aria-hidden="true" />
          <p className="sk-tagline">Paste text and get a short summary.</p>
        </header>

        <div className="sk-content px-4 pb-5 pt-5 sm:px-7 sm:pb-7 sm:pt-7 lg:px-8 lg:pb-8 lg:pt-9">
          <form onSubmit={handleSummarize}>
            {/* Input and summary are two equal-sized cards as in the image. */}
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-6">
              <section className="sk-panel min-w-0 overflow-hidden" aria-labelledby="input-heading">
                <div className="sk-panel-heading flex min-h-[76px] flex-wrap items-center justify-between gap-2 px-5 py-4 sm:px-7">
                  <h2 id="input-heading" className="sk-panel-title">Input Text</h2>
                  {/* Existing example-text functionality stays available. */}
                  <button
                    type="button"
                    className="sk-quiet-action"
                    onClick={() => { setText(EXAMPLE); setSummary(''); setError(''); }}
                    disabled={loading}
                  >
                    Try example text
                  </button>
                </div>

                <div className="p-4 sm:p-5">
                  <textarea
                    aria-label="Text to summarize"
                    className="sk-textarea block w-full resize-y"
                    placeholder="Paste an article, research notes, or a long passage here..."
                    value={text}
                    maxLength={MAX_LENGTH}
                    onChange={(event) => { setText(event.target.value); if (error) setError(''); }}
                  />
                  <div className="sk-panel-meta mt-3 flex flex-wrap justify-between gap-x-3 gap-y-1">
                    <span><strong>{words.toLocaleString()}</strong> words</span>
                    <span><strong>{text.length.toLocaleString()}</strong> / {MAX_LENGTH.toLocaleString()} characters</span>
                  </div>
                </div>
              </section>

              <section className="sk-panel min-w-0 overflow-hidden" aria-labelledby="result-heading" aria-live="polite">
                <div className="sk-panel-heading flex min-h-[76px] flex-wrap items-center justify-between gap-2 px-5 py-4 sm:px-7">
                  <h2 id="result-heading" className="sk-panel-title">Summary</h2>
                  {summary && (
                    <button type="button" onClick={copySummary} className="sk-quiet-action inline-flex items-center gap-1.5">
                      <Icon name={copied ? 'check' : 'copy'} size={16} />
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  )}
                </div>

                <div className="p-4 sm:p-5">
                  <div className="sk-result-box" aria-live="polite">
                    {loading ? (
                      <div className="sk-result-message" role="status">
                        <span className="sk-spinner" />
                        <h3>Finding the key ideas...</h3>
                        <p>{mode === 'extractive' ? 'Analyzing word frequencies and sentence relevance.' : 'Asking Gemini to write a concise summary.'}</p>
                      </div>
                    ) : error ? (
                      <div className="sk-result-message sk-error" role="alert">
                        <Icon name="info" size={30} />
                        <h3>Unable to summarize</h3>
                        <p>{error}</p>
                        <button type="submit" disabled={!text.trim()} className="sk-retry inline-flex items-center gap-2">
                          <Icon name="rotate" size={16} /> Try again
                        </button>
                      </div>
                    ) : summary ? (
                      <div className="sk-summary-content">
                        <p>{summary}</p>
                      </div>
                    ) : (
                      <div className="sk-result-message">
                        <p>Paste some text, choose your preferred method, and click Summarize to see the result.</p>
                      </div>
                    )}
                  </div>
                  <div className="sk-panel-meta mt-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                    <span><strong>{summaryWords.toLocaleString()}</strong> summary words</span>
                    <span><strong>{summary ? reduction : 0}%</strong> shorter</span>
                  </div>
                  <p className="sk-privacy mt-2 inline-flex items-center gap-1.5">
                    <Icon name="info" size={13} />
                    {mode === 'abstractive' ? 'Gemini processes submitted text remotely' : 'Extractive mode runs on your backend'}
                  </p>
                </div>
              </section>
            </div>

            {/* All original buttons and mode selection, restyled and rearranged. */}
            <section className="sk-controls mt-6 flex flex-col gap-5 px-5 py-5 md:flex-row md:flex-wrap md:items-center md:justify-between lg:flex-nowrap lg:px-8" aria-label="Summarization controls">
              <div className="flex flex-wrap items-center gap-3 sm:gap-4" role="group" aria-label="Summarization method">
                <span className="sk-mode-label">Mode:</span>
                <button
                  type="button"
                  aria-pressed={mode === 'extractive'}
                  disabled={loading}
                  title="Keep original sentences"
                  onClick={() => { setMode('extractive'); setSummary(''); setCopied(false); }}
                  className={`sk-button sk-mode-button ${mode === 'extractive' ? 'sk-blue-button' : 'sk-beige-button'}`}
                >
                  Extractive
                </button>
                <button
                  type="button"
                  aria-pressed={mode === 'abstractive'}
                  disabled={loading}
                  title="Rewrite with Gemini AI"
                  onClick={() => { setMode('abstractive'); setSummary(''); setCopied(false); }}
                  className={`sk-button sk-mode-button ${mode === 'abstractive' ? 'sk-blue-button' : 'sk-beige-button'}`}
                >
                  Abstractive
                </button>
              </div>

              <span className="sk-control-divider hidden lg:block" aria-hidden="true" />

              <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                {loading ? (
                  <button
                    type="button"
                    onClick={() => { controller.current?.abort(); controller.current = null; setLoading(false); }}
                    className="sk-button sk-blue-button sk-submit-button"
                  >
                    Cancel
                  </button>
                ) : (
                  <button type="submit" disabled={!text.trim()} className="sk-button sk-blue-button sk-submit-button">
                    Summarize
                  </button>
                )}
                <button
                  type="button"
                  onClick={clearAll}
                  disabled={!text && !summary && !error}
                  className="sk-button sk-beige-button sk-clear-button"
                >
                  Clear
                </button>
              </div>
            </section>
          </form>

          <footer className="sk-status mt-6 flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3 sm:px-7" aria-live="polite">
            <strong>{loading ? 'Working' : error ? 'Needs attention' : 'Ready'}</strong>
            <span className="sk-status-dot" aria-hidden="true">•</span>
            <span>{words.toLocaleString()} words</span>
            <span className="sk-status-dot" aria-hidden="true">•</span>
            <span>{loading ? 'Summarizing now' : error ? 'Please review the message above' : summary ? 'Last summary just now' : 'Waiting for input'}</span>
          </footer>
        </div>
      </main>
    </div>
  );
}
