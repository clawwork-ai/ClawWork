<div align="center">

<table border="0" cellspacing="0" cellpadding="0"><tr>
<td><img src="./docs/screenshot.png" alt="ClawWork Desktop" height="420" /></td>
<td><img src="https://github.com/user-attachments/assets/3dd775d0-8441-45d9-92f5-19e843f793c4" alt="ClawWork PWA" height="420" /></td>
</tr></table>

[English](./README.md) · [简体中文](./README.zh.md) · **繁體中文** · [日本語](./README.ja.md) · [한국어](./README.ko.md)

# ClawWork

**為 Agent OS 時代打造的本機優先工作區。**

[OpenClaw](https://github.com/openclaw/openclaw) 的桌面客戶端 —— 讓 Agent 任務並行執行、讓 artifacts 不遺失、讓檔案不再消失。

[![GitHub release](https://img.shields.io/github/v/release/clawwork-ai/clawwork?style=flat-square)](https://github.com/clawwork-ai/clawwork/releases/latest)
[![License](https://img.shields.io/github/license/clawwork-ai/clawwork?style=flat-square)](LICENSE)
[![Stars](https://img.shields.io/github/stars/clawwork-ai/clawwork?style=flat-square)](https://github.com/clawwork-ai/clawwork)

[下載](#下載) · [**PWA**](https://cpwa.pages.dev) · [快速開始](#快速開始) · [Teams](#teams) · [功能特性](#功能特性) · [資料與架構](#資料與架構) · [專案結構](#專案結構) · [Roadmap](#roadmap) · [貢獻](#貢獻) · [Keynote](https://clawwork-ai.github.io/ClawWork/keynote/)

</div>

> **⚠️ 官方儲存庫**
> 這是 ClawWork 的**官方**專案：https://github.com/clawwork-ai/clawwork
>
> 我們發現了山寨儲存庫（ClawWorkAi/ClawWork）與山寨網站（clawworkai.store），未經授權使用 ClawWork 名稱。請認準上方官方連結。
>
> 官方網站：https://clawwork-ai.github.io/ClawWork/

## 為什麼選 ClawWork

**Agent 正在爆炸式增長。瓶頸不再是能力，而是操作介面。**

隨著 Agent Runtime 越來越多，使用者被迫在聊天視窗、網頁 UI、終端機之間來回切換，每個都有自己的脈絡，彼此之間沒有共享記憶。正如 IDE 成為了程式碼的操作層、終端機成為了 Unix 的操作層 —— Agent OS 也需要一個工作區層。ClawWork 正在建構這一層：從 OpenClaw 的最佳客戶端起步，朝向多 Runtime 的未來演進。

### 現在：OpenClaw，從此不再被聊天紀錄淹沒

OpenClaw 本身很強，但純聊天是糟糕的承載容器。

一旦你同時執行多個會話、長任務、審批中斷、生成的檔案、定時自動化、不同的 gateway —— 聊天紀錄就會變成一灘泥。狀態消失、檔案消失、脈絡消失。

ClawWork 解決這個問題。每個任務都是一個擁有持久會話、artifacts、控制、歷史的獨立工作區，以三欄版面呈現：左邊任務列表、中間進行中的工作、右邊 artifacts 與脈絡。

## Teams

一個 Agent 有用，但一群協調好的 Agent 就是一支生產力。

ClawWork Teams 把多個 Agent 打包成一個可部署單元 —— 角色、人格、技能、工作流程俱全。**Coordinator** Agent 拆解任務並派發給 **Worker** Agent，每個 Worker 都在自己的子會話中執行。你即時看到完整的編排過程。

```
skill → agent → team
```

### Team 結構

```
teams/clawwork-dev/
├── TEAM.md                  # 團隊中繼資料與工作流程
└── agents/
    ├── manager/             # coordinator —— 協調團隊
    │   ├── IDENTITY.md      # 角色與提示
    │   ├── SOUL.md          # 人格與風格
    │   └── skills.json      # 技能依賴
    ├── architect/            # worker —— 設計方案
    ├── frontend-dev/         # worker —— 建構 UI
    ├── core-dev/             # worker —— 建構核心邏輯
    └── ...
```

### 取得 Team 的三種方式

- **[TeamsHub](https://github.com/clawwork-ai/teamshub-community)** —— 從 Git 原生儲存庫瀏覽並安裝社群貢獻的 Team。
- **手動建立** —— 用分步精靈定義 Agent、身份與技能。
- **AI Builder** —— 描述你的需求，讓 LLM 為你設計 Team 結構、角色與提示。

安裝後，建立任務時挑一個 Team，Coordinator 會接管後續。

## 下載

### Homebrew (macOS)

```bash
brew tap clawwork-ai/clawwork
brew install --cask clawwork
```

### 發布版本

macOS、Windows、Linux 的預建版本請見 [Releases 頁面](https://github.com/clawwork-ai/clawwork/releases/latest)。應用程式會自動更新 —— 新版本在背景下載，離開時安裝。

### PWA (瀏覽器)

無需安裝 —— 在任何現代瀏覽器中開啟 **[cpwa.pages.dev](https://cpwa.pages.dev)**。支援桌面與行動裝置，可加到主畫面。

## 快速開始

1. 啟動一個 OpenClaw Gateway。
2. 開啟 ClawWork，在設定中新增 gateway。用 token、密碼或配對碼驗證。預設本機端點：`ws://127.0.0.1:18789`。
3. 建立任務，挑選 gateway 與 agent，描述工作內容。
4. 聊天：傳送訊息、附加圖片、用 `@` 引用檔案作為脈絡、或用 `/` 指令。
5. 追蹤任務執行、檢視工具呼叫、保留輸出檔案。

## 功能特性

### ⚡ 任務優先的工作流程

- 多任務並行，每個任務獨立 OpenClaw 會話 —— 封存的任務可以重新開啟
- 依 gateway 分類的會話目錄
- 真正有用的會話控制：停止、重置、壓縮、刪除、同步
- 背景工作保持可讀，不會全部擠成一條長串
- 用 `cron`、`every`、`at` 表達式排程任務 —— 從預設挑或自己寫，檢視執行歷史，隨時手動觸發
- 匯出任意會話為 Markdown，在應用外留下乾淨的紀錄

### 👁 一目了然

- 即時串流回覆
- Agent 執行時內嵌顯示工具呼叫卡片
- 側邊欄顯示進度與 artifacts
- 花多少錢一目了然 —— 各 gateway 用量狀態、各會話成本明細、30 天滾動儀表板

### 🎛 更好的控制

- 多 gateway 支援
- 依任務切換 agent 與模型
- 直接管理 agents —— 建立、編輯、刪除、瀏覽工作區檔案，無需離開應用
- 瀏覽每個 gateway 的完整工具目錄，清楚知道 agent 能存取什麼
- 思考層級控制與 slash 指令
- 敏感操作執行前的審批確認
- 背景事件會通知你 —— 任務完成、審批請求、gateway 斷線 —— 點擊通知跳回任務。每類事件可單獨開關，噪音自己掌握。

### 📂 更好的檔案處理

- 真正有用的脈絡：圖片、`@` 檔案引用、語音輸入、監視資料夾
- 最多監視 10 個資料夾，自動偵測變化並重建索引，脈絡永遠新鮮
- 本機 artifact 儲存
- 助手回覆中的程式碼區塊與遠端圖片會被自動擷取並存到工作區 —— 無需手動複製貼上
- 跨任務、訊息、artifacts 的全文搜尋

### 🖥 更好的桌面體驗

- 系統匣支援
- 全域快捷鍵呼叫的快速啟動視窗（預設 `Alt+Space`，可自訂）
- 應用內完整鍵盤快捷鍵
- 背景自動更新 —— 在設定裡看到進度，離開時安裝
- 依你的舒適度縮放介面，並記住偏好
- 明暗主題 + 8 種語言

### 🔧 除錯

- 出問題時匯出除錯包（記錄檔、gateway 狀態、去識別化設定）—— 方便回報 bug
- 設定裡直接顯示所連接的 Gateway 伺服器版本

## 資料與架構

ClawWork 透過單一 Gateway WebSocket 連線與 OpenClaw 通訊。每個任務有自己的 session key 用於隔離，所有資料都存在你選定的本機工作區目錄 —— 無雲端同步、無外部資料庫。

- **Tasks** —— 每個任務對應到獨立的 OpenClaw 會話，並行工作互不衝突。
- **Messages** —— 使用者、助手、系統訊息（含工具呼叫與圖片附件）全部本機保存。
- **Artifacts** —— Agent 產出的程式碼區塊、圖片、檔案。從助手輸出中自動擷取，不會遺失。
- **全文搜尋** —— 跨以上所有內容搜尋。不記得是哪個任務裡的程式碼片段？三週前的也能找回來。

<div align="center">
<img src="./docs/architecture.svg" alt="ClawWork Architecture" width="840" />
</div>

## 專案結構

```
packages/shared/       — 協定類型、常數（零依賴）
packages/core/         — 共享商業邏輯：stores、services、ports
packages/desktop/
  src/main/            — Electron 主行程：gateway WS、IPC、DB、artifacts、OS 整合
  src/preload/         — 型別化的 window.clawwork 橋接層
  src/renderer/        — React UI：components、layouts、stores、hooks、i18n
packages/pwa/          — Progressive Web App（瀏覽器 + 行動裝置）
docs/                  — 設計文件、架構約束
e2e/                   — Playwright E2E 測試（冒煙 + gateway 整合）
scripts/               — 建置與檢查指令稿
website/               — 專案官網（React + Vite）
keynote/               — 簡報投影片（Slidev）
```

## 技術棧

Electron 34、React 19、TypeScript、Tailwind CSS v4、Zustand、SQLite（Drizzle ORM + better-sqlite3）、Framer Motion。

## 平台說明

- 語音輸入需要本機 [whisper.cpp](https://github.com/ggerganov/whisper.cpp) 執行檔與模型。
- 自動更新器僅對打包版本生效；開發模式會略過。
- 脈絡資料夾監視：最多 10 個目錄、4 層深、單檔 10 MB 以內。

## Roadmap

### ✅ 已發布

- 多任務並行執行，每個任務會話隔離
- 多 gateway 驗證（token、密碼、配對碼）
- 排程（cron）任務 + 執行歷史
- 跨 gateway 與會話的用量與成本儀表板
- 跨任務、訊息、artifacts 的全文搜尋
- Teams 與 TeamsHub —— 建構、分享、安裝多 Agent 編隊
- Skills（基於 ClawHub）—— 探索與安裝
- AI Builder —— LLM 輔助的 Team 建立
- PWA 離線支援與行動裝置 UI（[cpwa.pages.dev](https://cpwa.pages.dev)）
- 跨平台：macOS、Windows、Linux (AppImage + deb)，附自動更新

### 🔮 下一步

- 對話分支
- Artifact diff 檢視
- 自訂主題
- 定期工作流程的會話範本
- Skills、Teams、Adapters 的擴充 API 文件

### 🌐 願景 —— Agent OS 的工作區層

ClawWork 目前針對 OpenClaw 最佳化。我們正朝一個未來邁進：工作區層與 runtime 無關 —— 所有 Agent 都在同一個介面裡操作。

- **多 Runtime 轉接器** —— 把其他 Runtime 的 Agent 納入同一套 task / session / artifact 模型
- **更豐富的團隊編排** —— 超越 coordinator / worker 的協作模式
- **企業友善的本機優先** —— 更強的資料邊界與團隊協作模式，同時不放棄本機資料所有權

項目成熟後會挪到 _下一步_。本節不承諾任何時間表。

## Star History

[![Star History Chart](https://api.star-history.com/image?repos=clawwork-ai/ClawWork&type=date&legend=top-left)](https://www.star-history.com/?repos=clawwork-ai%2FClawWork&type=date&legend=top-left)

## 貢獻

參與方式：

- 閱讀 [DEVELOPMENT.md](DEVELOPMENT.md) 了解環境設定與專案結構
- 查看 [Issues](https://github.com/clawwork-ai/clawwork/issues)
- 發起 [Pull Request](https://github.com/clawwork-ai/clawwork/pulls)
- 送出前執行 `pnpm check` —— 會檢查 lint、架構、UI 合約、渲染層文案、i18n、死程式碼、格式、型別、測試。

翻譯可能會落後英文版本。如果你發現內容偏離，歡迎發 PR。

## License

[Apache 2.0](LICENSE)

<div align="center">

為 [OpenClaw](https://github.com/openclaw/openclaw) 而建。致敬 [Peter Steinberger](https://github.com/steipete) 的卓越貢獻。

</div>
