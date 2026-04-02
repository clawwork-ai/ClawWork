import { test, expect, describe } from 'vitest';
import {
  buildSessionKey,
  parseTaskIdFromSessionKey,
  buildSystemSessionKey,
  isSystemSession,
  isClawWorkSession,
  isSubagentSession,
} from '../src/constants';

test('parseTaskIdFromSessionKey parses current ClawWork session keys', () => {
  const taskId = 'task-current';
  const sessionKey = buildSessionKey(taskId);
  expect(parseTaskIdFromSessionKey(sessionKey)).toBe(taskId);
});

test('parseTaskIdFromSessionKey keeps accepting legacy task session keys', () => {
  expect(parseTaskIdFromSessionKey('agent:main:task-task-legacy')).toBe('task-legacy');
});

describe('system session keys', () => {
  test('buildSystemSessionKey produces valid format', () => {
    const key = buildSystemSessionKey('agent-scaffold');
    expect(key).toMatch(/^agent:main:clawwork:system:agent-scaffold:[a-f0-9-]+$/);
  });

  test('buildSystemSessionKey generates unique keys', () => {
    const a = buildSystemSessionKey('test');
    const b = buildSystemSessionKey('test');
    expect(a).not.toBe(b);
  });

  test('isSystemSession recognizes system session keys', () => {
    const key = buildSystemSessionKey('avatar-gen');
    expect(isSystemSession(key)).toBe(true);
  });

  test('isSystemSession rejects task session keys', () => {
    const taskKey = buildSessionKey('task-1');
    expect(isSystemSession(taskKey)).toBe(false);
  });

  test('isSystemSession rejects arbitrary strings', () => {
    expect(isSystemSession('random-string')).toBe(false);
    expect(isSystemSession('')).toBe(false);
    expect(isSystemSession('clawwork:system:')).toBe(false);
  });

  test('system session keys are invisible to task routing', () => {
    const key = buildSystemSessionKey('agent-scaffold');
    expect(parseTaskIdFromSessionKey(key)).toBeNull();
    expect(isClawWorkSession(key)).toBe(false);
    expect(isSubagentSession(key)).toBe(false);
  });
});
