// ============================================================
// Gateway WebSocket Protocol Types
// JSON-RPC inspired frames: req, res, event
// ============================================================

import type { ApprovalDecision, ExecApprovalRequest, ExecApprovalResolved } from './types.js';

export interface GatewayReqFrame {
  type: 'req';
  id: string;
  method: GatewayReqMethod;
  params: Record<string, unknown>;
}

export interface GatewayResFrame {
  type: 'res';
  id: string;
  ok: boolean;
  payload?: Record<string, unknown>;
  error?: { code: string; message: string; details?: Record<string, unknown> };
}

export interface GatewayEventFrame<TPayload = Record<string, unknown>> {
  type: 'event';
  event: GatewayEventName;
  seq?: number;
  payload: TPayload;
}

export type GatewayFrame = GatewayReqFrame | GatewayResFrame | GatewayEventFrame;

export type GatewayReqMethod = 'connect' | 'exec.approval.resolve' | (string & {});

export type GatewayEventName = 'exec.approval.requested' | 'exec.approval.resolved' | (string & {});

export interface ExecApprovalResolveParams {
  id: string;
  decision: ApprovalDecision;
}

export interface ExecApprovalRequestedEventFrame extends GatewayEventFrame<ExecApprovalRequest> {
  event: 'exec.approval.requested';
  payload: ExecApprovalRequest;
}

export interface ExecApprovalResolvedEventFrame extends GatewayEventFrame<ExecApprovalResolved> {
  event: 'exec.approval.resolved';
  payload: ExecApprovalResolved;
}

export type GatewayAuth =
  | { token: string; deviceToken?: string }
  | { password: string; deviceToken?: string }
  | { bootstrapToken: string; deviceToken?: string };

export interface GatewayConnectParams {
  minProtocol: 3;
  maxProtocol: 3;
  client: {
    id: string;
    displayName: string;
    version: string;
    platform: string;
    mode: 'backend';
    deviceFamily?: string;
  };
  caps: string[];
  auth: GatewayAuth;
  role: 'operator';
  scopes: string[];
  device?: {
    id: string;
    publicKey: string;
    signature: string;
    signedAt: number;
    nonce: string;
  };
}

export interface GatewayClientConfig {
  id: string;
  name: string;
  url: string;
  auth: GatewayAuth;
}
