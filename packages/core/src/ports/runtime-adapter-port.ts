import type { RuntimeAdapter } from '@clawwork/shared';

/**
 * Dependency injection port for RuntimeAdapter.
 * This allows switching between OpenClaw Gateway, ACP, etc.
 * without changing core service code.
 */
export interface RuntimeAdapterPort {
  getAdapter(runtimeId?: string): RuntimeAdapter;
  registerAdapter(adapter: RuntimeAdapter, makeDefault?: boolean): void;
  getDefaultAdapter(): RuntimeAdapter;
  getAllAdapters(): RuntimeAdapter[];
}
