export interface AgentDraft {
  uid: string;
  name: string;
  description: string;
  role: 'coordinator' | 'worker';
  model: string;
  agentMd: string;
  soulMd: string;
  skills: string[];
  existingAgentId?: string;
  lockedExisting?: boolean;
  expandedByDefault?: boolean;
}

export interface TeamInfo {
  name: string;
  emoji: string;
  description: string;
  gatewayId: string;
}
