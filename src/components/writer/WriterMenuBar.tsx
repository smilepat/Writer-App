'use client';

import { useEffect, useState } from 'react';
import { Loader2, Wand2, Zap, ZapOff, Clock, Maximize2, Minimize2 } from 'lucide-react';
import type { Language, Mode, Tone } from '@/app/writer/page';

interface Props {
  language: Language;
  setLanguage: (v: Language) => void;
  tone: Tone;
  setTone: (v: Tone) => void;
  mode: Mode;
  setMode: (v: Mode) => void;
  autoAnalyze: boolean;
  setAutoAnalyze: (v: boolean) => void;
  apiKeyConfigured: boolean;
  onSaveApiKey: (v: string) => void;
  onAnalyze: () => void;
  isLoading: boolean;
  hasInput: boolean;
  historyCount?: number;
  onShowHistory?: () => void;
  focusMode?: boolean;
  onToggleFocusMode?: () => void;
}

const LANGUAGES: { value: Language; label: string; flag: string }[] = [
  { value: 'ko', label: '한국어', flag: '🇰🇷' },
  { value: 'en', label: 'English', flag: '🇺🇸' },
  { value: 'ja', label: '日本語', flag: '🇯🇵' },
  { value: 'zh', label: '中文', flag: '🇨🇳' },
  { value: 'es', label: 'Español', flag: '🇪🇸' },
  { value: 'fr', label: 'Français', flag: '🇫🇷' },
  { value: 'de', label: 'Deutsch', flag: '🇩🇪' },
];

const TONES: { value: Tone; label: string; emoji: string }[] = [
  { value: 'formal', label: '공식체', emoji: '🎩' },
  { value: 'casual', label: '구어체', emoji: '💬' },
  { value: 'academic', label: '학술체', emoji: '🎓' },
  { value: 'creative', label: '창의적', emoji: '🎨' },
];

const MODES: { value: Mode; label: string; emoji: string; desc: string }[] = [
  { value: 'refine', label: '다듬기', emoji: '✨', desc: '더 명확하고 간결하게' },
  { value: 'summarize', label: '요약', emoji: '📝', desc: '핵심만 압축' },
  { value: 'expand', label: '확장', emoji: '🔭', desc: '더 풍부하고 상세하게' },
  { value: 'translate', label: '번역', emoji: '🌐', desc: '선택 언어로 번역' },
];

export default function WriterMenuBar({
  language, setLanguage,
  tone, setTone,
  mode, setMode,
  autoAnalyze, setAutoAnalyze,
  apiKeyConfigured,
  onSaveApiKey,
  onAnalyze, isLoading, hasInput,
  historyCount = 0,
  onShowHistory,
  focusMode,
  onToggleFocusMode,
}: Props) {
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');

  const currentMode = MODES.find(m => m.value === mode)!;
  const currentLang = LANGUAGES.find(l => l.value === language)!;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem('gemini_api_key') ?? '';
    setApiKeyInput(saved);
  }, []);

  const handleSaveApiKey = () => {
    onSaveApiKey(apiKeyInput);
    setShowApiKeyModal(false);
  };

  return (
    <header className="writer-menubar">
      {/* Brand */}
      <div className="writer-brand">
        <div className="writer-brand-icon">
          <Wand2 size={18} />
        </div>
        <span className="writer-brand-name">SmartWriter <span>AI</span></span>
      </div>

      {/* Controls */}
      <div className="writer-controls">
        {/* Mode selector */}
        <div className="writer-control-group">
          <label className="writer-control-label">모드</label>
          <div className="writer-mode-tabs">
            {MODES.map((m, i) => (
              <button
                key={m.value}
                onClick={() => setMode(m.value)}
                title={`${m.desc} (Ctrl+${i + 1})`}
                className={`writer-mode-tab ${mode === m.value ? 'active' : ''}`}
              >
                <span>{m.emoji}</span>
                <span>{m.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="writer-divider" />

        {/* Language */}
        <div className="writer-control-group">
          <label className="writer-control-label">출력 언어</label>
          <div className="writer-select-wrap">
            <span className="writer-select-prefix">{currentLang.flag}</span>
            <select
              value={language}
              onChange={e => setLanguage(e.target.value as Language)}
              className="writer-select"
              aria-label="출력 언어 선택"
            >
              {LANGUAGES.map(l => (
                <option key={l.value} value={l.value}>
                  {l.flag} {l.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tone */}
        <div className="writer-control-group">
          <label className="writer-control-label">문체</label>
          <div className="writer-select-wrap">
            <span className="writer-select-prefix">
              {TONES.find(t => t.value === tone)?.emoji}
            </span>
            <select
              value={tone}
              onChange={e => setTone(e.target.value as Tone)}
              className="writer-select"
              aria-label="문체 선택"
            >
              {TONES.map(t => (
                <option key={t.value} value={t.value}>
                  {t.emoji} {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="writer-actions">
        {/* Focus mode toggle */}
        {onToggleFocusMode && (
          <button
            type="button"
            onClick={onToggleFocusMode}
            className={`writer-auto-btn ${focusMode ? 'active' : ''}`}
            title={focusMode ? '포커스 모드 끄기 (Esc)' : '포커스 모드 켜기 (Ctrl+Shift+F)'}
          >
            {focusMode ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            <span>집중</span>
          </button>
        )}

        {/* Auto-analyze toggle */}
        <button
          onClick={() => setAutoAnalyze(!autoAnalyze)}
          className={`writer-auto-btn ${autoAnalyze ? 'active' : ''}`}
          title={autoAnalyze ? '자동 분석 켜짐 (클릭하여 끄기)' : '자동 분석 꺼짐 (클릭하여 켜기)'}
        >
          {autoAnalyze ? <Zap size={15} /> : <ZapOff size={15} />}
          <span>자동</span>
        </button>

        {onShowHistory && (
          <button
            type="button"
            onClick={onShowHistory}
            className={`writer-key-btn ${historyCount > 0 ? 'active' : ''}`}
            title="분석 히스토리"
          >
            <Clock size={14} />
            <span>히스토리{historyCount > 0 ? ` (${historyCount})` : ''}</span>
          </button>
        )}

        <button
          onClick={() => setShowApiKeyModal(true)}
          className={`writer-key-btn ${apiKeyConfigured ? 'active' : ''}`}
          title="Gemini API Key 설정"
        >
          <span>🔑</span>
          <span>API Key</span>
        </button>

        {/* Analyze button */}
        <button
          onClick={onAnalyze}
          disabled={isLoading || !hasInput}
          className="writer-analyze-btn"
          title="분석 실행 (Ctrl+Enter)"
        >
          {isLoading ? (
            <>
              <Loader2 size={15} className="animate-spin" />
              <span>분석 중…</span>
            </>
          ) : (
            <>
              <Wand2 size={15} />
              <span>
                {currentMode.emoji} {currentMode.label}
              </span>
            </>
          )}
        </button>
      </div>

      {showApiKeyModal && (
        <div className="writer-modal-backdrop" role="dialog" aria-modal="true" aria-label="Gemini API Key 설정">
          <div className="writer-modal-card">
            <div className="writer-modal-header">
              <h3>Gemini API Key 설정</h3>
              <p>입력한 키는 브라우저 localStorage에만 저장됩니다.</p>
            </div>
            <input
              type="password"
              className="writer-modal-input"
              placeholder="AIza..."
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              autoFocus
            />
            <div className="writer-modal-actions">
              <button
                className="writer-modal-btn ghost"
                onClick={() => setShowApiKeyModal(false)}
              >
                취소
              </button>
              <button
                className="writer-modal-btn danger"
                onClick={() => {
                  setApiKeyInput('');
                  onSaveApiKey('');
                  setShowApiKeyModal(false);
                }}
              >
                키 제거
              </button>
              <button
                className="writer-modal-btn primary"
                onClick={handleSaveApiKey}
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
