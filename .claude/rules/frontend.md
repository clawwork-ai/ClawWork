# Frontend Rules

## TypeScript

- [HIGH] No `as any`, `@ts-ignore`, `@ts-expect-error` without a preceding type guard
- [HIGH] All colors via CSS Variables (`var(--xxx)`) — no hardcoded hex values
- [HIGH] Zustand store hooks must use granular selectors (`useXxxStore((s) => s.field)`) — never select entire store
- [HIGH] New user-facing strings must use `t()` from react-i18next — no hardcoded UI text
- [HIGH] No `eval()`, `new Function()`, or inline scripts in renderer
- [HIGH] No comments in code — includes `//`, `/* */`, and JSDoc/TSDoc
- [MEDIUM] Prefer string literal unions over `enum`
- [MEDIUM] `React.FC` / `React.FunctionComponent` — use plain function declarations
- [MEDIUM] Icons from `lucide-react` only — no other icon libraries
- [MEDIUM] Animation presets from `@/styles/design-tokens` — no ad-hoc values
- [MEDIUM] Import types with `import type { ... }` when type-only
- [MEDIUM] No empty `catch` blocks that silently swallow errors
- [MEDIUM] Always check `IpcResult.ok` before accessing `.result`

## Structure

- Component files go in `layouts/` (layout components) or `components/` (general components), organized by feature
- State management uses Zustand, one store per domain (`taskStore`, `messageStore`, `uiStore`)
- WebSocket message types are defined in `@clawwork/shared`; desktop imports from there
- No CJK characters in code or git messages (i18n JSON locale files excepted)

## CI-Enforced (do not duplicate in review)

These are caught by `pnpm check` — reviewers should not flag them:

- TypeScript strict mode violations including implicit `any` (tsconfig)
- Unused imports/variables (ESLint)
- Formatting and whitespace (Prettier)
