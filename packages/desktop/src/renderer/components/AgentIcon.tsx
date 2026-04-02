import { useState } from 'react';
import { Bot } from 'lucide-react';

interface AgentIconProps {
  gatewayId?: string | null;
  agentId: string;
  gatewayAvatarUrl?: string;
  emoji?: string;
  imgClass?: string;
  emojiClass?: string;
  iconSize?: number;
  iconClass?: string;
}

export default function AgentIcon({
  gatewayId,
  agentId,
  gatewayAvatarUrl,
  emoji,
  imgClass = 'w-4 h-4 rounded-full object-cover',
  emojiClass = 'emoji-sm',
  iconSize = 14,
  iconClass = 'text-[var(--accent)]',
}: AgentIconProps) {
  const [failCount, setFailCount] = useState(0);
  const localUrl = gatewayId ? `clawwork-avatar://${gatewayId}/${agentId}` : undefined;
  const urls = [localUrl, gatewayAvatarUrl].filter(Boolean) as string[];
  const resolved = urls[failCount];

  if (resolved) {
    return <img src={resolved} alt="" className={imgClass} onError={() => setFailCount((c) => c + 1)} />;
  }
  if (emoji) return <span className={emojiClass}>{emoji}</span>;
  return <Bot size={iconSize} className={iconClass} />;
}
