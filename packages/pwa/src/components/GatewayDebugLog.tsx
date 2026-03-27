import { useSyncExternalStore, useRef, useEffect } from 'react';
import { X, Trash2, Copy, RefreshCw } from 'lucide-react';
import { getDebugLog, subscribeDebugLog, clearDebugLog } from '../lib/debug';
import { reconnectAllClients } from '../gateway/client';
import type { DebugLogEntry } from '../lib/debug';
import { BottomSheet } from './BottomSheet';

interface GatewayDebugLogProps {
  open: boolean;
  onClose: () => void;
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    const h = String(d.getHours()).padStart(2, '0');
    const mi = String(d.getMinutes()).padStart(2, '0');
    const s = String(d.getSeconds()).padStart(2, '0');
    const ms = String(d.getMilliseconds()).padStart(3, '0');
    return `${h}:${mi}:${s}.${ms}`;
  } catch {
    return iso;
  }
}

function levelColor(level: string): string {
  if (level === 'error') return 'var(--danger)';
  if (level === 'warn') return 'var(--warning)';
  return 'var(--text-tertiary)';
}

function eventColor(event: string): string {
  if (event.includes('.error') || event.includes('.failed')) return 'var(--danger)';
  if (event.includes('.ok') || event.includes('.connected')) return 'var(--accent)';
  if (event.includes('.challenge') || event.includes('.start')) return 'var(--warning)';
  return 'var(--text-primary)';
}

function compactData(entry: DebugLogEntry): string | null {
  const d = entry.data ?? (entry.error ? { error: entry.error.message } : null);
  if (!d) return null;
  try {
    return JSON.stringify(d);
  } catch {
    return null;
  }
}

export function GatewayDebugLog({ open, onClose }: GatewayDebugLogProps) {
  const log = useSyncExternalStore(subscribeDebugLog, getDebugLog);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [open, log.length]);

  const handleCopy = () => {
    const text = log
      .map((e) => {
        const d = compactData(e);
        return `${formatTime(e.ts)} [${e.level}] ${e.event}${d ? ' ' + d : ''}`;
      })
      .join('\n');
    navigator.clipboard.writeText(text).catch(() => {});
  };

  return (
    <BottomSheet open={open} onClose={onClose} maxHeight="80vh" ariaLabel="Gateway Log">
      <div className="flex shrink-0 items-center justify-between px-4 py-2" style={{ touchAction: 'manipulation' }}>
        <span className="type-label" style={{ color: 'var(--text-primary)' }}>
          Gateway Log ({log.length})
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={reconnectAllClients}
            className="rounded-lg p-1.5 transition-colors"
            style={{ color: 'var(--accent)', minHeight: 36, minWidth: 36 }}
            aria-label="Reconnect"
          >
            <RefreshCw size={16} />
          </button>
          <button
            onClick={handleCopy}
            className="rounded-lg p-1.5 transition-colors"
            style={{ color: 'var(--text-secondary)', minHeight: 36, minWidth: 36 }}
            aria-label="Copy log"
          >
            <Copy size={16} />
          </button>
          <button
            onClick={clearDebugLog}
            className="rounded-lg p-1.5 transition-colors"
            style={{ color: 'var(--text-secondary)', minHeight: 36, minWidth: 36 }}
            aria-label="Clear log"
          >
            <Trash2 size={16} />
          </button>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 transition-colors"
            style={{ color: 'var(--text-secondary)', minHeight: 36, minWidth: 36 }}
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      <div
        className="flex-1 overflow-y-auto p-3 font-mono type-code-block leading-relaxed"
        style={{ touchAction: 'pan-y' }}
      >
        {log.length === 0 && (
          <div className="py-8 text-center" style={{ color: 'var(--text-tertiary)' }}>
            No events yet
          </div>
        )}
        {log.map((entry, i) => {
          const data = compactData(entry);
          return (
            <div key={i} className="flex gap-2 py-0.5" style={{ wordBreak: 'break-all' }}>
              <span className="shrink-0 tabular-nums" style={{ color: 'var(--text-tertiary)' }}>
                {formatTime(entry.ts)}
              </span>
              <span className="shrink-0 uppercase" style={{ color: levelColor(entry.level), width: '2.5rem' }}>
                {entry.level === 'debug' ? 'dbg' : entry.level.slice(0, 3)}
              </span>
              <span>
                <span style={{ color: eventColor(entry.event) }}>{entry.event}</span>
                {data && <span style={{ color: 'var(--text-tertiary)' }}> {data}</span>}
              </span>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
    </BottomSheet>
  );
}
