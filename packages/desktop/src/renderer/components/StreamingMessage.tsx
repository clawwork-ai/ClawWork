import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import type { ToolCall } from '@clawwork/shared';
import { motion as motionPresets } from '@/styles/design-tokens';
import MessageAvatar from './MessageAvatar';
import ThinkingSection from './ThinkingSection';
import MarkdownContent from './MarkdownContent';
import ToolCallCard from './ToolCallCard';
import ToolCallSummary from './ToolCallSummary';

interface StreamingMessageProps {
  content: string;
  thinkingContent?: string;
  toolCalls?: ToolCall[];
  agentEmoji?: string;
  localAvatarUrl?: string;
  gatewayAvatarUrl?: string;
  agentName?: string;
  agentRoleLabel?: string;
}

const StreamingMessage = memo(function StreamingMessage({
  content,
  thinkingContent,
  toolCalls,
  agentEmoji,
  localAvatarUrl,
  gatewayAvatarUrl,
  agentName,
  agentRoleLabel,
}: StreamingMessageProps) {
  const { visibleTool, completedTools } = useMemo(() => {
    if (!toolCalls?.length) return { visibleTool: null, completedTools: [] as ToolCall[] };
    let visibleIdx = -1;
    for (let i = toolCalls.length - 1; i >= 0; i--) {
      if (toolCalls[i].status === 'running') {
        visibleIdx = i;
        break;
      }
    }
    if (visibleIdx === -1) visibleIdx = toolCalls.length - 1;
    const completed = toolCalls.filter((_, i) => i !== visibleIdx);
    return { visibleTool: toolCalls[visibleIdx], completedTools: completed };
  }, [toolCalls]);

  return (
    <motion.div
      initial={motionPresets.fadeIn.initial}
      animate={motionPresets.fadeIn.animate}
      transition={motionPresets.fadeIn.transition}
      className="flex gap-3.5 py-4"
    >
      <MessageAvatar
        role="assistant"
        agentEmoji={agentEmoji}
        localAvatarUrl={localAvatarUrl}
        gatewayAvatarUrl={gatewayAvatarUrl}
      />
      <div className="min-w-0 flex-1">
        {(agentName || agentRoleLabel) && (
          <div className="mb-1.5 flex min-w-0 flex-wrap items-center gap-2 text-[var(--text-muted)]">
            {agentName ? <div className="type-label truncate text-[var(--text-secondary)]">{agentName}</div> : null}
            {agentRoleLabel ? (
              <span className="type-meta inline-flex items-center rounded-full border border-[var(--border-subtle)] bg-[var(--bg-tertiary)] px-2 py-0.5 text-[var(--text-muted)]">
                {agentRoleLabel}
              </span>
            ) : null}
          </div>
        )}
        {thinkingContent && <ThinkingSection content={thinkingContent} defaultOpen streaming showCursor={!content} />}
        {toolCalls?.length ? (
          <div className="mb-2 space-y-1">
            {completedTools.length > 0 ? <ToolCallSummary toolCalls={completedTools} /> : null}
            {visibleTool ? <ToolCallCard key={visibleTool.id} toolCall={visibleTool} defaultOpen /> : null}
          </div>
        ) : null}
        {content && (
          <div className="leading-relaxed text-[var(--text-primary)]">
            <MarkdownContent content={content} showCursor />
          </div>
        )}
      </div>
    </motion.div>
  );
});

export default StreamingMessage;
