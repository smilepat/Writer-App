'use client';

import { useRef } from 'react';
import { Trash2, FileText } from 'lucide-react';

interface Props {
  value: string;
  onChange: (v: string) => void;
  onClear: () => void;
  isLoading: boolean;
}

const PLACEHOLDER = `여기에 글을 입력하세요…

예시:
• 회의록, 보고서, 이메일 초안
• 아이디어 메모, 에세이 초고
• 번역하고 싶은 텍스트

AI가 의도를 분석하여 메뉴에서 선택한 방식으로
오른쪽 화면에 개선된 결과를 보여드립니다.`;

function wordCount(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

export default function InputPanel({ value, onChange, onClear, isLoading }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const charCount = value.length;
  const words = wordCount(value);
  const lines = value ? value.split('\n').length : 0;

  return (
    <div className="writer-panel writer-panel-input">
      {/* Panel header */}
      <div className="writer-panel-header">
        <div className="writer-panel-title">
          <FileText size={15} />
          <span>입력</span>
          <span className="writer-panel-subtitle">내 글 초안</span>
        </div>
        <button
          onClick={onClear}
          disabled={!value}
          className="writer-icon-btn"
          title="모두 지우기"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Textarea */}
      <div className="writer-panel-body">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={PLACEHOLDER}
          disabled={isLoading}
          spellCheck={false}
          className="writer-textarea"
          aria-label="입력 텍스트"
        />
      </div>

      {/* Status bar */}
      <div className="writer-panel-footer">
        <div className="writer-stats">
          <span>{charCount.toLocaleString()}자</span>
          <span className="writer-stats-dot">·</span>
          <span>{words.toLocaleString()} 단어</span>
          <span className="writer-stats-dot">·</span>
          <span>{lines} 줄</span>
        </div>
        {charCount > 0 && charCount < 10 && (
          <span className="writer-hint">10자 이상 입력하면 분석할 수 있어요</span>
        )}
      </div>
    </div>
  );
}
