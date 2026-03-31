import { Bot, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MessageAvatarProps {
  role: 'user' | 'assistant';
  agentEmoji?: string;
}

export default function MessageAvatar({ role, agentEmoji }: MessageAvatarProps) {
  return (
    <div
      className={cn(
        'flex-shrink-0 size-[var(--density-avatar-size)] rounded-full flex items-center justify-center',
        role === 'user' ? 'bg-[var(--bg-tertiary)]' : 'bg-[var(--accent-dim)]',
      )}
    >
      {role === 'user' ? (
        <User className="size-[calc(var(--density-avatar-size)*0.6)] text-[var(--text-secondary)]" />
      ) : agentEmoji ? (
        <span className="emoji-md leading-none">{agentEmoji}</span>
      ) : (
        <Bot className="size-[calc(var(--density-avatar-size)*0.6)] text-[var(--accent)]" />
      )}
    </div>
  );
}
