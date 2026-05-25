import type {
  RuntimeAdapter,
  RuntimeCapabilities,
  RuntimeInfo,
  ExecutionRef,
  ExecutionInput,
  ExecutionEvent,
  ExecutionEventCallback,
  ExecutionEventSubscription,
} from '@clawwork/shared';
import type { GatewayTransportPort } from '../ports/gateway-transport.js';

/**
 * Adapter that wraps the existing GatewayTransportPort behind the RuntimeAdapter interface.
 * Bridges OpenClaw Gateway events (chat, agent, approval) into unified ExecutionEvent format.
 */
export function createOpenClawGatewayAdapter(
  gatewayId: string,
  gatewayName: string,
  transport: GatewayTransportPort,
): RuntimeAdapter {
  const listeners = new Set<ExecutionEventCallback>();

  function emit(event: ExecutionEvent): void {
    for (const cb of listeners) {
      try {
        cb(event);
      } catch {
        /* swallow listener errors */
      }
    }
  }

  function makeRef(sessionKey: string, label?: string): ExecutionRef {
    return { executionId: sessionKey, runtimeId: gatewayId, sessionKey, label };
  }

  // Bridge gateway events to execution events
  const removeGatewayEvent = transport.onGatewayEvent((data) => {
    if (data.event === 'chat') {
      const payload = data.payload as Record<string, unknown>;
      const sessionKey = payload.sessionKey as string;
      const state = payload.state as string;
      const text = (payload.text as string) || '';
      const runId = payload.runId as string;

      if (!sessionKey) return;

      if (state === 'delta') {
        emit({
          type: 'execution.message.delta',
          executionId: sessionKey,
          runtimeId: gatewayId,
          sessionKey,
          timestamp: Date.now(),
          text,
          runId,
        });
      } else if (state === 'final') {
        emit({
          type: 'execution.message.final',
          executionId: sessionKey,
          runtimeId: gatewayId,
          sessionKey,
          timestamp: Date.now(),
          text,
          runId,
        });
        emit({
          type: 'execution.completed',
          executionId: sessionKey,
          runtimeId: gatewayId,
          sessionKey,
          timestamp: Date.now(),
          runId,
        });
      } else if (state === 'error') {
        const errorMessage =
          (payload.errorMessage as string) || (payload.error as { message?: string })?.message || 'Unknown error';
        emit({
          type: 'execution.error',
          executionId: sessionKey,
          runtimeId: gatewayId,
          sessionKey,
          timestamp: Date.now(),
          message: errorMessage,
          code: (payload.errorCode as string) ?? (payload.error as { code?: string })?.code,
          runId,
        });
      } else if (state === 'aborted') {
        emit({
          type: 'execution.cancelled',
          executionId: sessionKey,
          runtimeId: gatewayId,
          sessionKey,
          timestamp: Date.now(),
        });
      }
    } else if (data.event === 'agent') {
      const payload = data.payload as Record<string, unknown>;
      const sessionKey = payload.sessionKey as string;
      const stream = payload.stream as string;
      const d = payload.data as Record<string, unknown>;

      if (!sessionKey || !d) return;

      if (stream === 'tool') {
        const toolData = d as {
          phase?: string;
          name?: string;
          toolCallId?: string;
          meta?: string;
          isError?: boolean;
          args?: string;
        };
        if (toolData.name && toolData.toolCallId) {
          const status = toolData.phase === 'result' ? (toolData.isError ? 'error' : 'done') : 'running';
          emit({
            type: 'execution.tool.call',
            executionId: sessionKey,
            runtimeId: gatewayId,
            sessionKey,
            timestamp: Date.now(),
            toolCallId: toolData.toolCallId,
            name: toolData.name,
            status: status as 'running' | 'done' | 'error',
            args: toolData.args ? JSON.parse(toolData.args) : undefined,
            result: toolData.meta,
          });
        }
      } else if (stream === 'lifecycle') {
        const lc = d as {
          phase?: string;
          selectedProvider?: string;
          selectedModel?: string;
          activeProvider?: string;
          activeModel?: string;
          error?: string;
        };
        emit({
          type: 'execution.lifecycle',
          executionId: sessionKey,
          runtimeId: gatewayId,
          sessionKey,
          timestamp: Date.now(),
          phase: (lc.phase as 'start' | 'end' | 'error' | 'fallback') || 'start',
          selectedProvider: lc.selectedProvider,
          selectedModel: lc.selectedModel,
          activeProvider: lc.activeProvider,
          activeModel: lc.activeModel,
          error: lc.error,
        });
      }
    } else if (data.event === 'exec.approval.requested') {
      const payload = data.payload as {
        id: string;
        request: Record<string, unknown>;
        createdAtMs: number;
        expiresAtMs: number;
      };
      const sessionKey = (data.payload as Record<string, unknown>).sessionKey as string | undefined;
      emit({
        type: 'execution.approval.requested',
        executionId: sessionKey || data.gatewayId,
        runtimeId: data.gatewayId,
        sessionKey,
        timestamp: Date.now(),
        id: payload.id,
        request: payload.request,
        createdAtMs: payload.createdAtMs,
        expiresAtMs: payload.expiresAtMs,
      });
    } else if (data.event === 'exec.approval.resolved') {
      const payload = data.payload as { id: string; decision?: string };
      emit({
        type: 'execution.approval.resolved',
        executionId: data.gatewayId,
        runtimeId: data.gatewayId,
        timestamp: Date.now(),
        id: payload.id,
        decision: payload.decision,
      });
    }
  });

  const capabilities: RuntimeCapabilities = {
    streamsText: true,
    supportsToolEvents: true,
    supportsApprovals: true,
    supportsMCP: true,
    accessesFilesystem: true,
    constrainsNetwork: false,
    supportsResume: false,
    producesArtifacts: false,
    reportsUsage: true,
    supportsChildExecutions: true,
    streamsThinking: true,
    reportsLifecycle: true,
  };

  let cachedInfo: RuntimeInfo | null = null;
  const cachedStatusInfo: { connected: boolean; serverVersion?: string } = { connected: false };

  const removeGatewayStatus = transport.onGatewayStatus((s) => {
    cachedStatusInfo.connected = s.connected;
    cachedStatusInfo.serverVersion = s.serverVersion;
    cachedInfo = null; // invalidate cache
  });

  return {
    getRuntimeInfo(): RuntimeInfo {
      if (cachedInfo) return cachedInfo;
      cachedInfo = {
        id: gatewayId,
        name: gatewayName,
        connected: cachedStatusInfo.connected,
        serverVersion: cachedStatusInfo.serverVersion,
      };
      return cachedInfo;
    },

    getCapabilities(): RuntimeCapabilities {
      return { ...capabilities };
    },

    async createExecution(params: {
      agentId: string;
      executionId: string;
      sessionKey: string;
      initialMessage?: string;
    }) {
      const res = await transport.createSession(gatewayId, {
        key: params.sessionKey,
        agentId: params.agentId,
        message: params.initialMessage,
      });
      if (!res.ok) throw new Error(res.error || 'Failed to create execution');
      return makeRef(params.sessionKey);
    },

    async sendInput(executionRef: ExecutionRef, input: ExecutionInput) {
      const res = await transport.sendMessage(
        executionRef.runtimeId,
        executionRef.executionId,
        input.message,
        input.attachments as Array<{ mimeType: string; fileName: string; content: string }> | undefined,
      );
      if (!res.ok) throw new Error(res.error || 'Failed to send input');
    },

    async cancelExecution(executionRef: ExecutionRef) {
      const res = await transport.abortChat(executionRef.runtimeId, executionRef.executionId);
      if (!res.ok) throw new Error(res.error || 'Failed to cancel execution');
    },

    async getHealth() {
      return { ok: cachedStatusInfo.connected };
    },

    onExecutionEvent(callback: ExecutionEventCallback): ExecutionEventSubscription {
      listeners.add(callback);
      return {
        unsubscribe: () => {
          listeners.delete(callback);
          if (listeners.size === 0) {
            removeGatewayEvent();
            removeGatewayStatus();
          }
        },
      };
    },

    // Optional methods
    async listChildren(executionRef: ExecutionRef) {
      const res = await transport.listSessionsBySpawner(gatewayId, executionRef.executionId);
      if (!res.ok || !res.result) return [];
      const sessions = res.result as Array<{ key: string; label?: string }>;
      return sessions.map((s: { key: string; label?: string }) => makeRef(s.key, s.label));
    },

    async listApprovals() {
      // Approvals are streamed via events; this is a placeholder
      return [];
    },

    async resolveApproval(_id: string, _decision: 'allow-once' | 'allow-always' | 'deny') {
      // The GatewayTransportPort doesn't have a resolveApproval directly;
      // this would need to be added or handled via HTTP
      throw new Error('resolveApproval not yet implemented on GatewayTransportPort');
    },

    async listModels() {
      const res = await transport.listModels(gatewayId);
      if (!res.ok || !res.result) return [];
      const data = res.result as { models?: Array<{ id: string; name?: string; provider?: string }> };
      return data.models || [];
    },

    async listAgents() {
      const res = await transport.listAgents(gatewayId);
      if (!res.ok || !res.result) return [];
      const data = res.result as { agents?: Array<{ id: string; name?: string }> };
      return data.agents || [];
    },

    async deleteExecution(executionRef: ExecutionRef) {
      const res = await transport.deleteSession(executionRef.runtimeId, executionRef.executionId);
      if (!res.ok) throw new Error(res.error || 'Failed to delete execution');
    },
  };
}
