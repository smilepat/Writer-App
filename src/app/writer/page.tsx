'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import WriterMenuBar from '@/components/writer/WriterMenuBar';
import InputPanel from '@/components/writer/InputPanel';
import OutputPanel from '@/components/writer/OutputPanel';
import KeywordsPanel from '@/components/writer/KeywordsPanel';
import HistoryDrawer from '@/components/writer/HistoryDrawer';
import { getHistory, addHistoryEntry, removeHistoryEntry, clearHistory, type HistoryEntry } from '@/lib/history';
import './writer.css';

// ── Shared types exported for child components ─────────────────
export type Language = 'ko' | 'en' | 'ja' | 'zh' | 'es' | 'fr' | 'de';
export type Tone = 'formal' | 'casual' | 'academic' | 'creative';
export type Mode = 'refine' | 'summarize' | 'expand' | 'translate';

export interface Keyword {
  word: string;
  definition: string;
}

export interface Concept {
  title: string;
  explanation: string;
  relatedTerms: string[];
}

export interface WritingScore {
  overall: number;
  readability: number;
  complexity: number;
  vocabularyDiversity: number;
  toneConsistency: number;
  suggestions: string[];
}

export interface Variant {
  tone: string;
  toneLabel: string;
  improved: string;
  highlight: string;
}

export interface AnalysisResult {
  improved: string;
  changes: string[];
  keywords: Keyword[];
  concepts: Concept[];
  contextExpansion: string;
  writingScore?: WritingScore;
}

// ── Page ───────────────────────────────────────────────────────
export default function WriterPage() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [lastAnalyzedInput, setLastAnalyzedInput] = useState('');

  // Menu state
  const [language, setLanguage] = useState<Language>('ko');
  const [tone, setTone] = useState<Tone>('formal');
  const [mode, setMode] = useState<Mode>('refine');
  const [autoAnalyze, setAutoAnalyze] = useState(true);

  // Responsive state
  const [mobileTab, setMobileTab] = useState<'input' | 'output'>('input');
  const [keywordsPanelOpen, setKeywordsPanelOpen] = useState(true);

  // Focus mode
  const [focusMode, setFocusMode] = useState(false);

  // History state
  const [historyEntries, setHistoryEntries] = useState<HistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Variants state
  const [variants, setVariants] = useState<Variant[]>([]);
  const [isLoadingVariants, setIsLoadingVariants] = useState(false);

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestSeqRef = useRef(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem('gemini_api_key') ?? '';
    if (saved) setApiKey(saved);
    setHistoryEntries(getHistory());
  }, []);

  const handleSaveApiKey = useCallback((nextApiKey: string) => {
    const normalized = nextApiKey.trim();
    setApiKey(normalized);
    if (typeof window !== 'undefined') {
      if (normalized) localStorage.setItem('gemini_api_key', normalized);
      else localStorage.removeItem('gemini_api_key');
    }
  }, []);

  const analyze = useCallback(
    async (text: string) => {
      const normalized = text.trim();
      if (!normalized || normalized.length < 5) return;
      const requestSeq = ++requestSeqRef.current;
      setIsLoading(true);
      setError(null);
      setErrorType(null);
      try {
        const res = await fetch('/api/writer-analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            input: normalized,
            language,
            tone,
            mode,
            apiKey: apiKey || undefined,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          if (requestSeq === requestSeqRef.current && data.errorType) setErrorType(data.errorType);
          throw new Error(data.error ?? 'AI 분석에 실패했습니다.');
        }
        // Only apply response if this is the latest request
        if (requestSeq === requestSeqRef.current) {
          const analysisResult = data as AnalysisResult;
          setResult(analysisResult);
          setLastAnalyzedInput(normalized);
          addHistoryEntry({ input: normalized, result: analysisResult, language, tone, mode });
          setHistoryEntries(getHistory());
        }
      } catch (err: unknown) {
        if (requestSeq === requestSeqRef.current) {
          setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
        }
      } finally {
        if (requestSeq === requestSeqRef.current) {
          setIsLoading(false);
        }
      }
    },
    [apiKey, language, tone, mode]
  );

  // Auto-analyze: debounce 1.8 s after user stops typing
  useEffect(() => {
    if (!autoAnalyze) return;
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      analyze(input);
    }, 1800);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [input, autoAnalyze, analyze]);

  // Keyboard shortcuts
  const MODES_ORDER: Mode[] = ['refine', 'summarize', 'expand', 'translate'];
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;

      // Ctrl+Enter: analyze
      if (ctrl && e.key === 'Enter') {
        e.preventDefault();
        analyze(input);
        return;
      }
      // Ctrl+Shift+C: copy result
      if (ctrl && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        if (result?.improved) navigator.clipboard.writeText(result.improved);
        return;
      }
      // Ctrl+1~4: switch mode
      if (ctrl && e.key >= '1' && e.key <= '4') {
        e.preventDefault();
        const idx = parseInt(e.key) - 1;
        if (MODES_ORDER[idx]) setMode(MODES_ORDER[idx]);
        return;
      }
      // Ctrl+Shift+F: toggle focus mode
      if (ctrl && e.shiftKey && e.key === 'F') {
        e.preventDefault();
        setFocusMode(v => !v);
        return;
      }
      // Escape: close modals / exit focus mode
      if (e.key === 'Escape') {
        if (focusMode) { setFocusMode(false); return; }
        if (showHistory) setShowHistory(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [input, result, analyze, showHistory, focusMode]);

  const handleAnalyze = () => analyze(input);
  const handleClear = () => {
    setInput('');
    setResult(null);
    setError(null);
  };

  const handleHistorySelect = (entry: HistoryEntry) => {
    setInput(entry.input);
    setResult(entry.result);
    setLastAnalyzedInput(entry.input);
    setLanguage(entry.language);
    setTone(entry.tone);
    setMode(entry.mode);
    setShowHistory(false);
  };
  const handleHistoryRemove = (id: string) => {
    removeHistoryEntry(id);
    setHistoryEntries(getHistory());
  };
  const handleHistoryClear = () => {
    clearHistory();
    setHistoryEntries([]);
  };

  const handleGenerateVariants = useCallback(async () => {
    const normalized = input.trim();
    if (!normalized || normalized.length < 5) return;
    setIsLoadingVariants(true);
    setVariants([]);
    try {
      const tones = ['formal', 'casual', 'academic', 'creative'].filter(t => t !== tone);
      const res = await fetch('/api/writer-variants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: normalized,
          language,
          tones: [tone, ...tones.slice(0, 2)],
          mode,
          apiKey: apiKey || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setVariants(data.variants ?? []);
    } catch {
      setVariants([]);
    } finally {
      setIsLoadingVariants(false);
    }
  }, [input, language, tone, mode, apiKey]);

  return (
    <div className={`writer-shell ${keywordsPanelOpen ? '' : 'keywords-collapsed'} ${focusMode ? 'focus-mode' : ''}`}>
      {/* ── TOP: Menu bar ── */}
      <WriterMenuBar
        language={language}
        setLanguage={setLanguage}
        tone={tone}
        setTone={setTone}
        mode={mode}
        setMode={setMode}
        autoAnalyze={autoAnalyze}
        setAutoAnalyze={setAutoAnalyze}
        apiKeyConfigured={Boolean(apiKey)}
        onSaveApiKey={handleSaveApiKey}
        onAnalyze={handleAnalyze}
        isLoading={isLoading}
        hasInput={input.trim().length >= 5}
        historyCount={historyEntries.length}
        onShowHistory={() => setShowHistory(true)}
        focusMode={focusMode}
        onToggleFocusMode={() => setFocusMode(v => !v)}
      />

      {/* ── Mobile tab switcher ── */}
      <div className="writer-mobile-tabs">
        <button
          type="button"
          className={`writer-mobile-tab ${mobileTab === 'input' ? 'active' : ''}`}
          onClick={() => setMobileTab('input')}
        >
          입력
        </button>
        <button
          type="button"
          className={`writer-mobile-tab ${mobileTab === 'output' ? 'active' : ''}`}
          onClick={() => setMobileTab('output')}
        >
          출력 {result ? '●' : ''}
        </button>
      </div>

      {/* ── MIDDLE: Left input | Right output ── */}
      <div className="writer-main">
        <div className={`writer-panel-wrap writer-panel-wrap--input ${mobileTab === 'input' ? 'mobile-visible' : 'mobile-hidden'}`}>
          <InputPanel
            value={input}
            onChange={setInput}
            onClear={handleClear}
            isLoading={isLoading}
          />
        </div>
        <div className={`writer-panel-wrap writer-panel-wrap--output ${mobileTab === 'output' ? 'mobile-visible' : 'mobile-hidden'}`}>
          <OutputPanel
            result={result}
            isLoading={isLoading}
            error={error}
            errorType={errorType}
            mode={mode}
            liveInput={input}
            isStale={Boolean(input.trim()) && input.trim() !== lastAnalyzedInput}
            onRetry={handleAnalyze}
            originalInput={lastAnalyzedInput}
            variants={variants}
            isLoadingVariants={isLoadingVariants}
            onGenerateVariants={handleGenerateVariants}
          />
        </div>
      </div>

      {/* ── BOTTOM: Keywords, concepts, context ── */}
      <KeywordsPanel
        result={result}
        isLoading={isLoading}
        isOpen={keywordsPanelOpen}
        onToggle={() => setKeywordsPanelOpen(v => !v)}
      />

      {showHistory && (
        <HistoryDrawer
          entries={historyEntries}
          onSelect={handleHistorySelect}
          onRemove={handleHistoryRemove}
          onClearAll={handleHistoryClear}
          onClose={() => setShowHistory(false)}
        />
      )}
    </div>
  );
}
