# Main Process Rules (Electron)

## Connection & IPC

- [HIGH] Single WS connection to Gateway `:18789` — no direct HTTP API calls
- [HIGH] `ipcMain.handle()` registers once at app startup, never inside `createWindow()` or event handlers
- [HIGH] Preload bridge (`contextBridge`) exposes only the minimal API surface — no raw `ipcRenderer`, `process`, `require`, or `__dirname`
- [HIGH] No `nodeIntegration: true` or `contextIsolation: false` in BrowserWindow options

## Security

- [HIGH] User-supplied URLs must go through SSRF guard (`net/ssrf-guard.ts`)
- [HIGH] File path validation: validate + read in a single fd-centric atomic op (no TOCTOU)
- [HIGH] URL-to-path conversion: always use `fileURLToPath()`, never `url.replace('file://', '')`

## Session Routing

- [HIGH] Session key format: `agent:main:clawwork:task:<taskId>` — one Task = one session
- [HIGH] Gateway broadcasts all events; client MUST filter by `sessionKey` — missing filter leaks cross-task data
