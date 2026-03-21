'use client';

import { useState } from 'react';
import { Tag, BookOpen, Compass, ChevronDown, ChevronUp } from 'lucide-react';
import type { AnalysisResult } from '@/app/writer/page';

interface Props {
  result: AnalysisResult | null;
  isLoading: boolean;
}

const KEYWORD_COLOR_CLASSES = [
  'kw-color-blue',
  'kw-color-green',
  'kw-color-purple',
  'kw-color-orange',
  'kw-color-emerald',
  'kw-color-red',
];

function KeywordBadge({
  word,
  definition,
  index,
}: {
  word: string;
  definition: string;
  index: number;
}) {
  const [showDef, setShowDef] = useState(false);
  const colorClass = KEYWORD_COLOR_CLASSES[index % KEYWORD_COLOR_CLASSES.length];

  return (
    <div className="keyword-badge-wrap">
      <button
        className={`keyword-badge ${colorClass}`}
        onClick={() => setShowDef(v => !v)}
        title={definition}
      >
        <Tag size={11} />
        <span>{word}</span>
        {showDef ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
      </button>
      {showDef && (
        <div className={`keyword-definition ${colorClass}`}>
          {definition}
        </div>
      )}
    </div>
  );
}

function ConceptCard({
  title,
  explanation,
  relatedTerms,
}: {
  title: string;
  explanation: string;
  relatedTerms: string[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className={`concept-card ${open ? 'open' : ''}`}>
      <button className="concept-card-header" onClick={() => setOpen(v => !v)}>
        <div className="concept-card-icon">
          <BookOpen size={13} />
        </div>
        <span className="concept-card-title">{title}</span>
        <ChevronDown
          size={14}
          className="concept-card-chevron"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </button>
      {open && (
        <div className="concept-card-body">
          <p className="concept-explanation">{explanation}</p>
          {relatedTerms && relatedTerms.length > 0 && (
            <div className="concept-related">
              <span className="concept-related-label">관련 개념:</span>
              {relatedTerms.map((term, i) => (
                <span key={i} className="concept-related-tag">{term}</span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SkeletonRow() {
  return <div className="writer-skeleton-line writer-skeleton-kw-row" />;
}

export default function KeywordsPanel({ result, isLoading }: Props) {
  const hasData = !isLoading && result;

  return (
    <div className="writer-keywords-panel">
      {/* === KEYWORDS SECTION === */}
      <div className="keywords-section">
        <div className="keywords-section-header">
          <Tag size={13} />
          <span>핵심 키워드</span>
        </div>
        <div className="keywords-list">
          {isLoading ? (
            <>
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </>
          ) : hasData && result.keywords && result.keywords.length > 0 ? (
            result.keywords.map((kw, i) => (
              <KeywordBadge
                key={i}
                word={kw.word}
                definition={kw.definition}
                index={i}
              />
            ))
          ) : (
            <p className="keywords-empty">분석 후 키워드가 표시됩니다</p>
          )}
        </div>
      </div>

      {/* === CONCEPTS SECTION === */}
      <div className="concepts-section">
        <div className="keywords-section-header">
          <BookOpen size={13} />
          <span>개념 설명</span>
        </div>
        <div className="concepts-list">
          {isLoading ? (
            <div className="writer-skeleton writer-skeleton-concept">
              <div className="writer-skeleton-line writer-skeleton-concept-row" />
              <div className="writer-skeleton-line writer-skeleton-concept-row" />
            </div>
          ) : hasData && result.concepts && result.concepts.length > 0 ? (
            result.concepts.map((c, i) => (
              <ConceptCard
                key={i}
                title={c.title}
                explanation={c.explanation}
                relatedTerms={c.relatedTerms ?? []}
              />
            ))
          ) : (
            <p className="keywords-empty">복잡한 개념이 감지되면 여기에 설명이 표시됩니다</p>
          )}
        </div>
      </div>

      {/* === CONTEXT EXPANSION SECTION === */}
      <div className="context-section">
        <div className="keywords-section-header">
          <Compass size={13} />
          <span>맥락 확장</span>
        </div>
        <div className="context-body">
          {isLoading ? (
            <div className="writer-skeleton">
              <div className="writer-skeleton-line" />
              <div className="writer-skeleton-line writer-skeleton-line--90" />
              <div className="writer-skeleton-line writer-skeleton-line--70" />
            </div>
          ) : hasData && result.contextExpansion ? (
            <p className="context-text">{result.contextExpansion}</p>
          ) : (
            <p className="keywords-empty">분석 후 관련 맥락과 배경 지식이 표시됩니다</p>
          )}
        </div>
      </div>
    </div>
  );
}
