'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { Copy, Check, Sparkles, RefreshCw, AlertCircle, Download, GitCompareArrows } from 'lucide-react';
import type { AnalysisResult, Mode, Variant } from '@/app/writer/page';
import { exportResult } from '@/lib/export';
import { computeWordDiff, type DiffSegment } from '@/lib/diff';

interface Props {
  result: AnalysisResult | null;
  isLoading: boolean;
  error: string | null;
  errorType?: string | null;
  mode: Mode;
  liveInput: string;
  isStale: boolean;
  onRetry?: () => void;
  originalInput?: string;
  variants?: Variant[];
  isLoadingVariants?: boolean;
  onGenerateVariants?: () => void;
}

const ERROR_GUIDANCE: Record<string, { title: string; hint: string }> = {
  no_api_key: { title: 'API Key가 설정되지 않았습니다', hint: '상단 메뉴의 🔑 API Key 버튼에서 Gemini API Key를 입력해주세요.' },
  api_key_invalid: { title: 'API Key가 유효하지 않습니다', hint: 'API Key를 확인하고 다시 설정해주세요. Google AI Studio에서 새 키를 발급받을 수 있습니다.' },
  rate_limit: { title: '요청 한도 초과', hint: '잠시 후 다시 시도해주세요. Gemini API의 분당 요청 제한에 도달했습니다.' },
  network: { title: '네트워크 오류', hint: '인터넷 연결을 확인하고 다시 시도해주세요.' },
  short_input: { title: '입력이 너무 짧습니다', hint: '10자 이상의 텍스트를 입력해주세요.' },
  empty_input: { title: '입력 텍스트가 없습니다', hint: '왼쪽 패널에 분석할 텍스트를 입력해주세요.' },
};

const MODE_LABELS: Record<Mode, { label: string; emoji: string }> = {
  refine:    { label: '다듬기 결과',   emoji: '✨' },
  summarize: { label: '요약 결과',     emoji: '📝' },
  expand:    { label: '확장 결과',     emoji: '🔭' },
  translate: { label: '번역 결과',     emoji: '🌐' },
};

function SkeletonBlock({ lines = 4 }: { lines?: number }) {
  return (
    <div className="writer-skeleton">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={`writer-skeleton-line ${i === lines - 1 ? 'writer-skeleton-line--60' : ''}`}
        />
      ))}
    </div>
  );
}

function DiffView({ segments }: { segments: DiffSegment[] }) {
  return (
    <div className="writer-diff-view">
      {segments.map((seg, i) => (
        <span key={i} className={`diff-${seg.type}`}>{seg.text}</span>
      ))}
    </div>
  );
}

const TONE_EMOJI: Record<string, string> = { formal: '🎩', casual: '💬', academic: '🎓', creative: '🎨' };

export default function OutputPanel({ result, isLoading, error, errorType, mode, liveInput, isStale, onRetry, originalInput, variants = [], isLoadingVariants, onGenerateVariants }: Props) {
  const [copied, setCopied] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showDiff, setShowDiff] = useState(false);
  const [activeVariantIdx, setActiveVariantIdx] = useState<number | null>(null);
  const exportRef = useRef<HTMLDivElement>(null);
  const meta = MODE_LABELS[mode];
  const hasLiveInput = Boolean(liveInput.trim());

  useEffect(() => {
    if (!showExport) return;
    const handleClick = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) setShowExport(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showExport]);

  const diffSegments = useMemo(() => {
    if (!showDiff || !originalInput || !result?.improved) return [];
    return computeWordDiff(originalInput, result.improved);
  }, [showDiff, originalInput, result?.improved]);

  const handleCopy = async () => {
    if (!result?.improved) return;
    await navigator.clipboard.writeText(result.improved);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExport = (format: 'md' | 'txt' | 'html') => {
    if (result) exportResult(result, format);
    setShowExport(false);
  };

  return (
    <div className="writer-panel writer-panel-output">
      {/* Panel header */}
      <div className="writer-panel-header">
        <div className="writer-panel-title">
          <Sparkles size={15} className={`writer-mode-icon writer-mode-icon--${mode}`} />
          <span>출력</span>
          <span className={`writer-panel-subtitle writer-mode-text writer-mode-text--${mode}`}>
            {meta.emoji} {meta.label}
          </span>
        </div>
        <div className="writer-header-actions">
          {originalInput && result?.improved && (
            <button
              type="button"
              onClick={() => setShowDiff(v => !v)}
              className={`writer-icon-btn ${showDiff ? 'writer-icon-btn--active' : ''}`}
              title={showDiff ? '결과만 보기' : '비교 보기 (Diff)'}
            >
              <GitCompareArrows size={14} />
            </button>
          )}
          <button
            type="button"
            onClick={handleCopy}
            disabled={!result?.improved}
            className="writer-icon-btn"
            title="클립보드에 복사 (Ctrl+Shift+C)"
          >
            {copied ? <Check size={14} className="writer-copied-icon" /> : <Copy size={14} />}
          </button>
          <div ref={exportRef} className="writer-export-wrap">
            <button
              type="button"
              onClick={() => setShowExport(v => !v)}
              disabled={!result?.improved}
              className="writer-icon-btn"
              title="내보내기"
            >
              <Download size={14} />
            </button>
            {showExport && (
              <div className="writer-export-menu">
                <button type="button" className="writer-export-item" onClick={() => handleExport('md')}>Markdown (.md)</button>
                <button type="button" className="writer-export-item" onClick={() => handleExport('txt')}>텍스트 (.txt)</button>
                <button type="button" className="writer-export-item" onClick={() => handleExport('html')}>HTML (.html)</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="writer-panel-body">
        {hasLiveInput && (isLoading || isStale || !result?.improved) && (
          <div className="writer-live-preview">
            <div className="writer-live-preview-head">
              <span className="writer-live-dot" />
              <span>실시간 입력 반영</span>
            </div>
            <div className="writer-live-preview-text">{liveInput}</div>
          </div>
        )}

        {isLoading ? (
          <div className="writer-output-loading">
            <div className="writer-loading-indicator">
            <RefreshCw size={18} className={`animate-spin writer-mode-icon writer-mode-icon--${mode}`} />
              <span>AI가 분석 중입니다…</span>
            </div>
            <SkeletonBlock lines={6} />
          </div>
        ) : error ? (
          <div className="writer-error-state">
            <AlertCircle size={20} />
            <p className="writer-error-title">
              {(errorType && ERROR_GUIDANCE[errorType]?.title) || '오류가 발생했습니다'}
            </p>
            <p className="writer-error-msg">
              {(errorType && ERROR_GUIDANCE[errorType]?.hint) || error}
            </p>
            {onRetry && errorType !== 'empty_input' && errorType !== 'short_input' && errorType !== 'no_api_key' && (
              <button type="button" className="writer-retry-btn" onClick={onRetry}>
                <RefreshCw size={14} />
                다시 시도
              </button>
            )}
          </div>
        ) : result?.improved ? (
          <div className="writer-output-content">
            {/* Improved text or Diff view */}
            {showDiff && diffSegments.length > 0 ? (
              <DiffView segments={diffSegments} />
            ) : (
              <div className="writer-output-text">{result.improved}</div>
            )}

            {/* Changes list */}
            {result.changes && result.changes.length > 0 && (
              <div className="writer-changes">
                <div className="writer-changes-title">
                <span className={`writer-changes-dot writer-changes-dot--${mode}`} />
                개선 사항
              </div>
              <ul className="writer-changes-list">
                {result.changes.map((change, i) => (
                  <li key={i} className="writer-changes-item">
                    <span className={`writer-changes-num writer-mode-text writer-mode-text--${mode}`}>
                        {i + 1}
                      </span>
                      {change}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Variants section */}
            <div className="writer-variants-section">
              {onGenerateVariants && variants.length === 0 && !isLoadingVariants && (
                <button type="button" className="writer-variants-btn" onClick={onGenerateVariants}>
                  <Sparkles size={14} />
                  다른 톤으로 비교하기
                </button>
              )}
              {isLoadingVariants && (
                <div className="writer-loading-indicator">
                  <RefreshCw size={14} className="animate-spin" />
                  <span>다중 변형 생성 중…</span>
                </div>
              )}
              {variants.length > 0 && (
                <div className="writer-variants">
                  <div className="writer-changes-title">
                    <span className="writer-changes-dot writer-changes-dot--variant" />
                    다중 변형 비교
                  </div>
                  <div className="writer-variant-tabs">
                    {variants.map((v, i) => (
                      <button
                        type="button"
                        key={i}
                        className={`writer-variant-tab ${activeVariantIdx === i ? 'active' : ''}`}
                        onClick={() => setActiveVariantIdx(activeVariantIdx === i ? null : i)}
                      >
                        {TONE_EMOJI[v.tone] || ''} {v.toneLabel}
                      </button>
                    ))}
                  </div>
                  {activeVariantIdx !== null && variants[activeVariantIdx] && (
                    <div className="writer-variant-content">
                      <p className="writer-variant-highlight">{variants[activeVariantIdx].highlight}</p>
                      <div className="writer-output-text">{variants[activeVariantIdx].improved}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="writer-empty-state">
            <div className="writer-empty-icon">
              <Sparkles size={32} />
            </div>
            <p className="writer-empty-title">AI 출력 대기 중</p>
            <p className="writer-empty-desc">
              왼쪽에 글을 입력하고 상단에서 모드와 언어를 선택한 후<br />
              <strong>분석 버튼</strong>을 누르거나 <strong>자동 분석</strong>을 켜보세요.
            </p>
          </div>
        )}
      </div>

      {/* Footer word count */}
      {result?.improved && (
        <div className="writer-panel-footer">
          <div className="writer-stats">
            <span>{result.improved.length.toLocaleString()}자</span>
            <span className="writer-stats-dot">·</span>
            <span>
              {result.improved.trim().split(/\s+/).length.toLocaleString()} 단어
            </span>
          </div>
          {copied && <span className="writer-hint writer-hint-success">복사됨 ✓</span>}
        </div>
      )}
    </div>
  );
}
