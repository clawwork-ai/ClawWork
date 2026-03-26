import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ToolCall } from '@clawwork/shared';
import { Wrench, CheckCircle, Loader, AlertCircle, ChevronDown, ChevronRight } from 'lucide-react';

interface ToolCallCardProps {
  toolCall: ToolCall;
}

const RESULT_TRUNCATE_LIMIT = 500;

function getStatusIcon(status: ToolCall['status']) {
  switch (status) {
    case 'done':
      return CheckCircle;
    case 'error':
      return AlertCircle;
    case 'running':
      return Loader;
  }
}

function getStatusColor(status: ToolCall['status']): string {
  switch (status) {
    case 'done':
      return 'var(--accent)';
    case 'error':
      return 'var(--danger)';
    case 'running':
      return 'var(--text-muted)';
  }
}

export function ToolCallCard({ toolCall }: ToolCallCardProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  const StatusIcon = getStatusIcon(toolCall.status);
  const statusColor = getStatusColor(toolCall.status);

  return (
    <div className="rounded-xl" style={{ backgroundColor: 'var(--bg-secondary)' }}>
      <button
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        aria-label={`${toolCall.name} - ${toolCall.status}`}
        className="flex w-full items-center gap-2 px-3 text-left"
        style={{ minHeight: 44 }}
      >
        <Wrench size={14} style={{ color: 'var(--text-muted)' }} aria-hidden="true" />
        <span className="type-label flex-1 truncate" style={{ color: 'var(--text-secondary)' }}>
          {toolCall.name}
        </span>
        <StatusIcon
          size={14}
          style={{ color: statusColor }}
          className={toolCall.status === 'running' ? 'animate-spin' : ''}
          aria-hidden="true"
        />
        {expanded ? (
          <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} aria-hidden="true" />
        ) : (
          <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} aria-hidden="true" />
        )}
      </button>
      {expanded && (
        <div className="px-3 py-2">
          {toolCall.args && (
            <pre className="type-code-inline overflow-x-auto" style={{ color: 'var(--text-muted)' }}>
              {JSON.stringify(toolCall.args, null, 2)}
            </pre>
          )}
          {toolCall.result && (
            <pre className="type-code-inline mt-1 overflow-x-auto" style={{ color: 'var(--text-secondary)' }}>
              {toolCall.result.length > RESULT_TRUNCATE_LIMIT
                ? toolCall.result.slice(0, RESULT_TRUNCATE_LIMIT) + '\u2026'
                : toolCall.result}
            </pre>
          )}
          {!toolCall.args && !toolCall.result && (
            <span className="type-support" style={{ color: 'var(--text-muted)' }}>
              {t('tools.emptyDetails', { defaultValue: 'No details available' })}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
