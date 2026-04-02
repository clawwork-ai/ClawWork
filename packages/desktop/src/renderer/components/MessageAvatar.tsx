import { useState } from 'react';
import { Bot, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MessageAvatarProps {
  role: 'user' | 'assistant';
  agentEmoji?: string;
  localAvatarUrl?: string;
  gatewayAvatarUrl?: string;
}

export default function MessageAvatar({ role, agentEmoji, localAvatarUrl, gatewayAvatarUrl }: MessageAvatarProps) {
  const [failCount, setFailCount] = useState(0);
  const urls = [localAvatarUrl, gatewayAvatarUrl].filter(Boolean) as string[];
  const avatarUrl = urls[failCount];
  const showImg = role === 'assistant' && avatarUrl;

  return (
    <div
      className={cn(
        'flex-shrink-0 size-[var(--density-avatar-size)] rounded-full flex items-center justify-center overflow-hidden',
        role === 'user' ? 'bg-[var(--bg-tertiary)]' : !showImg && 'bg-[var(--accent-dim)]',
      )}
    >
      {role === 'user' ? (
        <User className="size-[calc(var(--density-avatar-size)*0.6)] text-[var(--text-secondary)]" />
      ) : showImg ? (
        <img
          src={avatarUrl}
          alt=""
          className="size-[var(--density-avatar-size)] rounded-full object-cover"
          onError={() => setFailCount((c) => c + 1)}
        />
      ) : agentEmoji ? (
        <span className="emoji-md leading-none">{agentEmoji}</span>
      ) : (
        <Bot className="size-[calc(var(--density-avatar-size)*0.6)] text-[var(--accent)]" />
      )}
    </div>
  );
}
