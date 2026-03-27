import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import type { ToolCall } from '@clawwork/shared';
import { motion as motionPresets } from '@/styles/design-tokens';
import MessageAvatar from './MessageAvatar';
import ThinkingSection from './ThinkingSection';
import MarkdownContent from './MarkdownContent';
import ToolCallCard from './ToolCallCard';

interface StreamingMessageProps {
  content: string;
  thinkingContent?: string;
  toolCalls?: ToolCall[];
  messageLayout?: 'centered' | 'wide';
}

const StreamingMessage = memo(function StreamingMessage({
  content,
  thinkingContent,
  toolCalls,
  messageLayout = 'centered',
}: StreamingMessageProps) {
  const lastRunningId = useMemo(() => {
    if (!toolCalls?.length) return null;
    for (let i = toolCalls.length - 1; i >= 0; i--) {
      if (toolCalls[i].status === 'running') return toolCalls[i].id;
    }
    return null;
  }, [toolCalls]);

  return (
    <motion.div
      initial={motionPresets.fadeIn.initial}
      animate={motionPresets.fadeIn.animate}
      transition={motionPresets.fadeIn.transition}
      className="flex gap-3.5 py-4"
    >
      <MessageAvatar role="assistant" />
      <div
        className={
          messageLayout === 'centered' ? 'min-w-0 max-w-[var(--content-max-width)]' : 'min-w-0 w-full max-w-none'
        }
      >
        {thinkingContent && <ThinkingSection content={thinkingContent} defaultOpen streaming showCursor={!content} />}
        {toolCalls?.length ? (
          <div className="mb-2 space-y-1">
            {toolCalls.map((tc) => {
              const isLatestRunning = tc.id === lastRunningId;
              return (
                <ToolCallCard
                  key={`${tc.id}-${isLatestRunning ? 'expanded' : 'collapsed'}`}
                  toolCall={tc}
                  defaultOpen={isLatestRunning}
                />
              );
            })}
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
