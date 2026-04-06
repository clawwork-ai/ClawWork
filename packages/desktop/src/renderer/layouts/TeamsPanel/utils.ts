import { cn } from '@/lib/utils';
import type { AgentDraft } from './types';

export function toSlug(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || `agent-${Date.now()}`
  );
}

export const inputClass = cn(
  'w-full h-[var(--density-control-height)] px-3 rounded-md',
  'bg-[var(--bg-primary)] border border-[var(--border)]',
  'text-[var(--text-primary)] placeholder:text-[var(--text-muted)]',
  'glow-focus focus:border-transparent transition-all',
);

export function createAgentDraft(role: 'coordinator' | 'worker'): AgentDraft {
  return { uid: crypto.randomUUID(), name: '', description: '', role, model: '', agentMd: '', soulMd: '', skills: [] };
}
