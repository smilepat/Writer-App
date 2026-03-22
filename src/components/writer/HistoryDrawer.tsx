'use client';

import { Clock, Trash2, X } from 'lucide-react';
import type { HistoryEntry } from '@/lib/history';
import type { Mode } from '@/app/writer/page';

interface Props {
  entries: HistoryEntry[];
  onSelect: (entry: HistoryEntry) => void;
  onRemove: (id: string) => void;
  onClearAll: () => void;
  onClose: () => void;
}

const MODE_EMOJI: Record<Mode, string> = {
  refine: '✨',
  summarize: '📝',
  expand: '🔭',
  translate: '🌐',
};

function formatTime(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function HistoryDrawer({ entries, onSelect, onRemove, onClearAll, onClose }: Props) {
  return (
    <div className="writer-modal-backdrop" onClick={onClose}>
      <div className="history-drawer" onClick={e => e.stopPropagation()}>
        <div className="history-drawer-header">
          <div className="history-drawer-title">
            <Clock size={16} />
            <span>분석 히스토리</span>
            <span className="history-count">{entries.length}</span>
          </div>
          <div className="history-drawer-actions">
            {entries.length > 0 && (
              <button type="button" className="writer-modal-btn ghost" onClick={onClearAll}>
                전체 삭제
              </button>
            )}
            <button type="button" className="writer-icon-btn" onClick={onClose} title="닫기">
              <X size={14} />
            </button>
          </div>
        </div>
        <div className="history-drawer-body">
          {entries.length === 0 ? (
            <p className="keywords-empty" style={{ padding: '24px', textAlign: 'center' }}>
              아직 분석 히스토리가 없습니다
            </p>
          ) : (
            entries.map(entry => (
              <button
                type="button"
                key={entry.id}
                className="history-item"
                onClick={() => onSelect(entry)}
              >
                <div className="history-item-top">
                  <span className="history-item-mode">{MODE_EMOJI[entry.mode]}</span>
                  <span className="history-item-time">{formatTime(entry.timestamp)}</span>
                  <button
                    type="button"
                    className="history-item-remove"
                    onClick={e => { e.stopPropagation(); onRemove(entry.id); }}
                    title="삭제"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
                <div className="history-item-preview">
                  {entry.input.slice(0, 80)}{entry.input.length > 80 ? '…' : ''}
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
