'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import WriterMenuBar from '@/components/writer/WriterMenuBar';
import InputPanel from '@/components/writer/InputPanel';
import OutputPanel from '@/components/writer/OutputPanel';
import KeywordsPanel from '@/components/writer/KeywordsPanel';
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

export interface AnalysisResult {
  improved: string;
  changes: string[];
  keywords: Keyword[];
  concepts: Concept[];
  contextExpansion: string;
}

// ── Page ───────────────────────────────────────────────────────
export default function WriterPage() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [lastAnalyzedInput, setLastAnalyzedInput] = useState('');

  // Menu state
  const [language, setLanguage] = useState<Language>('ko');
  const [tone, setTone] = useState<Tone>('formal');
  const [mode, setMode] = useState<Mode>('refine');
  const [autoAnalyze, setAutoAnalyze] = useState(true);

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestSeqRef = useRef(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem('gemini_api_key') ?? '';
    if (saved) setApiKey(saved);
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
        if (!res.ok) throw new Error(data.error ?? 'AI 분석에 실패했습니다.');
        // Only apply response if this is the latest request
        if (requestSeq === requestSeqRef.current) {
          setResult(data as AnalysisResult);
          setLastAnalyzedInput(normalized);
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

  const handleAnalyze = () => analyze(input);
  const handleClear = () => {
    setInput('');
    setResult(null);
    setError(null);
  };

  return (
    <div className="writer-shell">
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
      />

      {/* ── MIDDLE: Left input | Right output ── */}
      <div className="writer-main">
        <InputPanel
          value={input}
          onChange={setInput}
          onClear={handleClear}
          isLoading={isLoading}
        />
        <OutputPanel
          result={result}
          isLoading={isLoading}
          error={error}
          mode={mode}
          liveInput={input}
          isStale={Boolean(input.trim()) && input.trim() !== lastAnalyzedInput}
        />
      </div>

      {/* ── BOTTOM: Keywords, concepts, context ── */}
      <KeywordsPanel result={result} isLoading={isLoading} />
    </div>
  );
}
