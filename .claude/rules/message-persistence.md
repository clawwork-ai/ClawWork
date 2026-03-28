# Message Persistence — Single Writer per Role

Violating this WILL cause message duplication.

| Role        | Sole Writer                               | File                                                              |
| ----------- | ----------------------------------------- | ----------------------------------------------------------------- |
| `user`      | `ChatInput` (after `chat.send` succeeds)  | `packages/desktop/src/renderer/components/ChatInput/index.tsx`    |
| `assistant` | `syncSessionMessages` / `syncFromGateway` | `packages/core/src/services/session-sync.ts`                      |
| `system`    | `addMessage` (client-generated)           | `packages/core/src/stores/message-store.ts`                       |

Any new DB write path for messages requires full review.

## PROHIBITED patterns (each caused regressions)

- `finalizeStream` calling `persistMessage`
- Content-based dedup (`role:content` matching)
- `content.trim()` as identity/dedup mechanism
- Timestamp-based dedup
- Persisting assistant messages from any path other than `packages/core/src/services/session-sync.ts`

Full state machine: `docs/message-persistence.md`
