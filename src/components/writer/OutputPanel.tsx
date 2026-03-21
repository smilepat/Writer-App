'use client';

import { useState } from 'react';
import { Copy, Check, Sparkles, RefreshCw, AlertCircle } from 'lucide-react';
import type { AnalysisResult, Mode } from '@/app/writer/page';

interface Props {
  result: AnalysisResult | null;
  isLoading: boolean;
  error: string | null;
  mode: Mode;
  liveInput: string;
  isStale: boolean;
}

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

export default function OutputPanel({ result, isLoading, error, mode, liveInput, isStale }: Props) {
  const [copied, setCopied] = useState(false);
  const meta = MODE_LABELS[mode];
  const hasLiveInput = Boolean(liveInput.trim());

  const handleCopy = async () => {
    if (!result?.improved) return;
    await navigator.clipboard.writeText(result.improved);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
        <button
          onClick={handleCopy}
          disabled={!result?.improved}
          className="writer-icon-btn"
          title="클립보드에 복사"
        >
          {copied ? <Check size={14} className="writer-copied-icon" /> : <Copy size={14} />}
        </button>
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
            <p className="writer-error-title">오류가 발생했습니다</p>
            <p className="writer-error-msg">{error}</p>
          </div>
        ) : result?.improved ? (
          <div className="writer-output-content">
            {/* Improved text */}
            <div className="writer-output-text">{result.improved}</div>

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
