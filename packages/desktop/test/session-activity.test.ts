import { describe, expect, it } from 'vitest';
import { deriveSessionActivity, getTaskSessionKeys, type ActiveTurn } from '@clawwork/core';
import type { Task, TaskRoom } from '@clawwork/shared';

function turn(overrides: Partial<ActiveTurn>): ActiveTurn {
  return {
    id: 'turn-1',
    streamingText: '',
    streamingThinking: '',
    toolCalls: [],
    finalized: false,
    content: '',
    timestamp: '2026-04-28T00:00:00.000Z',
    ...overrides,
  };
}

describe('session activity', () => {
  it('returns waiting for processing without renderable turn', () => {
    expect(deriveSessionActivity(['s1'], {}, new Set(['s1']))).toBe('waiting');
  });

  it('returns responding for streaming thinking', () => {
    expect(deriveSessionActivity(['s1'], { s1: turn({ streamingThinking: 'thinking' }) }, new Set())).toBe(
      'responding',
    );
  });

  it('returns tooling for tool-call-only active turns', () => {
    expect(
      deriveSessionActivity(
        ['s1'],
        {
          s1: turn({
            toolCalls: [{ id: 'tc-1', name: 'bash', status: 'running', startedAt: '2026-04-28T00:00:00.000Z' }],
          }),
        },
        new Set(),
      ),
    ).toBe('tooling');
  });

  it('ignores finalized turns', () => {
    expect(deriveSessionActivity(['s1'], { s1: turn({ finalized: true, content: 'done' }) }, new Set())).toBe('idle');
  });

  it('includes performer sessions for task rooms', () => {
    const task = { sessionKey: 'main' } as Task;
    const room = { performers: [{ sessionKey: 'performer' }] } as TaskRoom;

    expect(getTaskSessionKeys(task, room)).toEqual(['main', 'performer']);
  });
});
