'use client';

import { BarChart3, Lightbulb } from 'lucide-react';
import type { WritingScore } from '@/app/writer/page';

interface Props {
  score: WritingScore;
}

const SCORE_ITEMS: { key: keyof Omit<WritingScore, 'overall' | 'suggestions'>; label: string; desc: string }[] = [
  { key: 'readability', label: '가독성', desc: '문장의 이해 용이성' },
  { key: 'complexity', label: '문장 구조', desc: '적절한 복잡도 균형' },
  { key: 'vocabularyDiversity', label: '어휘 다양성', desc: '단어 선택의 풍부함' },
  { key: 'toneConsistency', label: '톤 일관성', desc: '문체의 통일성' },
];

function getScoreColor(score: number): string {
  if (score >= 80) return '#059669';
  if (score >= 60) return '#d97706';
  return '#dc2626';
}

function getScoreLabel(score: number): string {
  if (score >= 90) return '우수';
  if (score >= 80) return '양호';
  if (score >= 60) return '보통';
  if (score >= 40) return '개선 필요';
  return '미흡';
}

function ScoreBar({ value, label, desc }: { value: number; label: string; desc: string }) {
  const color = getScoreColor(value);
  return (
    <div className="score-bar-item">
      <div className="score-bar-header">
        <span className="score-bar-label">{label}</span>
        <span className="score-bar-value" style={{ color }}>{value}</span>
      </div>
      <div className="score-bar-track">
        <div className="score-bar-fill" style={{ width: `${value}%`, background: color }} />
      </div>
      <span className="score-bar-desc">{desc}</span>
    </div>
  );
}

export default function ScorePanel({ score }: Props) {
  const overallColor = getScoreColor(score.overall);

  return (
    <div className="score-panel">
      {/* Overall score circle */}
      <div className="score-overall">
        <div className="score-circle" style={{ borderColor: overallColor }}>
          <span className="score-circle-value" style={{ color: overallColor }}>{score.overall}</span>
          <span className="score-circle-label">{getScoreLabel(score.overall)}</span>
        </div>
        <span className="score-overall-title">종합 점수</span>
      </div>

      {/* Individual scores */}
      <div className="score-details">
        {SCORE_ITEMS.map(item => (
          <ScoreBar key={item.key} value={score[item.key]} label={item.label} desc={item.desc} />
        ))}
      </div>

      {/* Suggestions */}
      {score.suggestions && score.suggestions.length > 0 && (
        <div className="score-suggestions">
          <div className="score-suggestions-header">
            <Lightbulb size={13} />
            <span>개선 제안</span>
          </div>
          <ul className="score-suggestions-list">
            {score.suggestions.map((s, i) => (
              <li key={i} className="score-suggestion-item">{s}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
