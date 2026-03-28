# Main Process Rules (Electron)

- Single WS connection to Gateway `:18789` — no direct HTTP API calls
- Session key format: `agent:main:clawwork:task:<taskId>` — one Task = one session
- Gateway broadcasts all events; client MUST filter by sessionKey
- IPC handlers register once at app startup, never inside `createWindow()`
- Preload bridge (`contextBridge`) exposes only the minimal API surface — no raw IPC, no private keys
- File path validation: validate + read in a single fd-centric atomic op (no TOCTOU)
- URL-to-path conversion: always use `fileURLToPath()`, never string replace
