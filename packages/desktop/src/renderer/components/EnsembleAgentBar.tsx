import { useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTaskStore } from '@/stores/taskStore';
import { useRoomStore } from '@/stores/roomStore';
import { useUiStore } from '@/stores/uiStore';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import AgentIcon from '@/components/AgentIcon';
import type { RoomPerformer } from '@clawwork/shared';
import { motionDuration } from '@/styles/design-tokens';

const EMPTY_PERFORMERS: readonly RoomPerformer[] = [];

interface EnsembleAgentBarProps {
  taskId: string;
}

export default function EnsembleAgentBar({ taskId }: EnsembleAgentBarProps) {
  const task = useTaskStore((s) => s.tasks.find((t) => t.id === taskId));
  const performers = useRoomStore((s) => s.rooms[taskId]?.performers ?? EMPTY_PERFORMERS);
  const agents = useUiStore((s) => (task?.gatewayId ? s.agentCatalogByGateway[task.gatewayId]?.agents : undefined));

  const catalogById = useMemo(() => new Map((agents ?? []).map((a) => [a.id, a])), [agents]);

  const uniquePerformers = useMemo(() => {
    const seen = new Set<string>();
    return performers.filter((p) => {
      if (seen.has(p.agentId)) return false;
      seen.add(p.agentId);
      return true;
    });
  }, [performers]);

  if (!task?.ensemble || uniquePerformers.length === 0) return null;

  return (
    <div className="pointer-events-none absolute inset-x-0 top-[var(--density-toolbar-height)] z-10 px-5 pt-2">
      <div className="pointer-events-auto inline-flex items-center gap-2">
        <AnimatePresence initial={false}>
          {uniquePerformers.map((p) => {
            const catalog = catalogById.get(p.agentId);
            const modelName = catalog?.model?.primary;
            return (
              <motion.div
                key={p.agentId}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ duration: motionDuration.moderate }}
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      data-testid="agent-avatar"
                      className="flex h-9 w-9 shrink-0 cursor-default items-center justify-center rounded-full bg-[var(--bg-secondary)] ring-1 ring-[var(--border-subtle)] transition-transform hover:scale-110"
                    >
                      <AgentIcon
                        gatewayId={task.gatewayId}
                        agentId={p.agentId}
                        emoji={catalog?.identity?.emoji ?? p.emoji}
                        gatewayAvatarUrl={catalog?.identity?.avatarUrl}
                        imgClass="w-9 h-9 rounded-full object-cover"
                        emojiClass="emoji-md"
                        iconSize={20}
                        iconClass="text-[var(--accent)]"
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <div className="type-label">{p.agentName}</div>
                    {modelName && <div className="type-meta text-[var(--text-muted)]">{modelName}</div>}
                  </TooltipContent>
                </Tooltip>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
