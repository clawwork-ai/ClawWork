---
theme: default
title: ClawWork — How It's Built
info: |
  ## ClawWork — Engineering Deep Dive
  15 days · 161 PRs · 13 releases. How we built it.

  [GitHub](https://github.com/clawwork-ai/ClawWork)
author: samzong
keywords: openclaw,desktop,agent,parallel-tasks,engineering
highlighter: shiki
colorSchema: all
drawings:
  persist: false
transition: slide-left
favicon: /images/clawwork-logo.png
exportFilename: clawwork-keynote-dev
---

<DeckCoverSlide />

---

# 👋 {{ $t({ en: 'About Me', zh: '关于我', ja: '自己紹介', ko: '소개', fr: 'À propos', de: 'Über mich', es: 'Sobre mí', pt: 'Sobre mim' }) }}

<DeckAboutMeSlide />

---

# 🚀 {{ $t({ en: 'Launch Sprint', zh: '启动冲刺', ja: 'ローンチスプリント', ko: '런칭 스프린트', fr: 'Sprint de lancement', de: 'Start-Sprint', es: 'Sprint de lanzamiento', pt: 'Sprint de lançamento' }) }}

<div class="cw-kicker">{{ $t({ en: '13 Releases in 15 Days', zh: '15 天发布 13 个版本', ja: '15日間で13リリース', ko: '15일 만에 13개 릴리스', fr: '13 versions en 15 jours', de: '13 Releases in 15 Tagen', es: '13 versiones en 15 días', pt: '13 versões em 15 dias' }) }}</div>

<div class="cw-version-grid mt-6">
  <div class="cw-version-card" data-tone="green">
    <div class="cw-version-num">v0.0.1</div>
    <div class="cw-version-desc">{{ $t({ en: 'Multi-task + streaming', zh: '多任务 + 流式', ja: 'マルチタスク + ストリーミング', ko: '멀티태스크 + 스트리밍', fr: 'Multitâche + streaming', de: 'Multi-Task + Streaming', es: 'Multitarea + streaming', pt: 'Multitarefa + streaming' }) }}</div>
  </div>
  <div class="cw-version-card" data-tone="green">
    <div class="cw-version-num">v0.0.2</div>
    <div class="cw-version-desc">{{ $t({ en: 'Image + archive + CI', zh: '图片 + 归档 + CI', ja: '画像 + アーカイブ + CI', ko: '이미지 + 아카이브 + CI', fr: 'Image + archive + CI', de: 'Bild + Archiv + CI', es: 'Imagen + archivo + CI', pt: 'Imagem + arquivo + CI' }) }}</div>
  </div>
  <div class="cw-version-card" data-tone="green">
    <div class="cw-version-num">v0.0.3</div>
    <div class="cw-version-desc">{{ $t({ en: 'Agent switch + multi-GW', zh: 'Agent 切换 + 多网关', ja: 'Agent 切替 + マルチ GW', ko: 'Agent 전환 + 멀티 GW', fr: 'Switch Agent + multi-GW', de: 'Agent-Wechsel + Multi-GW', es: 'Cambio de Agent + multi-GW', pt: 'Troca de Agent + multi-GW' }) }}</div>
  </div>
  <div class="cw-version-card" data-tone="cyan">
    <div class="cw-version-num">v0.0.4</div>
    <div class="cw-version-desc">{{ $t({ en: 'Voice + shortcuts', zh: '语音 + 快捷键', ja: '音声 + ショートカット', ko: '음성 + 단축키', fr: 'Voix + raccourcis', de: 'Sprache + Tastenkürzel', es: 'Voz + atajos', pt: 'Voz + atalhos' }) }}</div>
  </div>
  <div class="cw-version-card" data-tone="cyan">
    <div class="cw-version-num">v0.0.5</div>
    <div class="cw-version-desc">{{ $t({ en: 'Mic permission fix', zh: '麦克风修复', ja: 'マイク権限修正', ko: '마이크 권한 수정', fr: 'Correctif permission micro', de: 'Mikrofon-Berechtigung behoben', es: 'Corrección permiso micrófono', pt: 'Correção permissão microfone' }) }}</div>
  </div>
  <div class="cw-version-card" data-tone="purple">
    <div class="cw-version-num">v0.0.6</div>
    <div class="cw-version-desc">{{ $t({ en: 'Tray + tool approval', zh: '托盘 + 工具审批', ja: 'トレイ + ツール承認', ko: '트레이 + 도구 승인', fr: 'Barre système + approbation', de: 'Tray + Werkzeug-Genehmigung', es: 'Bandeja + aprobación', pt: 'Bandeja + aprovação' }) }}</div>
  </div>
  <div class="cw-version-card" data-tone="purple">
    <div class="cw-version-num">v0.0.7</div>
    <div class="cw-version-desc">{{ $t({ en: '@ context + usage', zh: '文件上下文 + 用量', ja: 'ファイルコンテキスト + 使用量', ko: '파일 컨텍스트 + 사용량', fr: 'Contexte fichier + usage', de: 'Dateikontext + Nutzung', es: 'Contexto archivo + uso', pt: 'Contexto arquivo + uso' }) }}</div>
  </div>
  <div class="cw-version-card" data-tone="yellow">
    <div class="cw-version-num">v0.0.8</div>
    <div class="cw-version-desc">{{ $t({ en: 'Resize + FTS + auth', zh: '拖拽 + 搜索 + 配对码', ja: 'リサイズ + 検索 + 認証', ko: '리사이즈 + 검색 + 인증', fr: 'Redim. + recherche + auth', de: 'Resize + Suche + Auth', es: 'Redim. + búsqueda + auth', pt: 'Redim. + busca + auth' }) }}</div>
  </div>
  <div class="cw-version-card" data-tone="red">
    <div class="cw-version-num">v0.0.9</div>
    <div class="cw-version-desc">{{ $t({ en: '9 security fixes', zh: '9 项安全修复', ja: '9件のセキュリティ修正', ko: '보안 수정 9건', fr: '9 correctifs sécurité', de: '9 Sicherheitskorrekturen', es: '9 correcciones seguridad', pt: '9 correções de segurança' }) }}</div>
  </div>
  <div class="cw-version-card" data-tone="green">
    <div class="cw-version-num">v0.0.10</div>
    <div class="cw-version-desc">{{ $t({ en: 'Auto-update + export', zh: '自动更新 + 导出', ja: '自動更新 + エクスポート', ko: '자동 업데이트 + 내보내기', fr: 'Mise à jour auto + export', de: 'Auto-Update + Export', es: 'Actualización auto + exportar', pt: 'Atualização auto + exportar' }) }}</div>
  </div>
  <div class="cw-version-card" data-tone="green">
    <div class="cw-version-num">v0.0.11</div>
    <div class="cw-version-desc">{{ $t({ en: 'Cron + notifications + live watch', zh: 'Cron + 通知 + 实时监听', ja: 'Cron + 通知 + ライブ監視', ko: 'Cron + 알림 + 실시간 감시', fr: 'Cron + notifications + surveillance', de: 'Cron + Benachrichtigungen + Live-Watch', es: 'Cron + notificaciones + monitoreo', pt: 'Cron + notificações + monitoramento' }) }}</div>
  </div>
  <div class="cw-version-card" data-tone="cyan">
    <div class="cw-version-num">v0.0.12</div>
    <div class="cw-version-desc">{{ $t({ en: '8 locales + local @ files', zh: '8 语种 + 本地 @ 文件', ja: '8言語 + ローカル @ ファイル', ko: '8개 언어 + 로컬 @ 파일', fr: '8 langues + fichiers @ locaux', de: '8 Sprachen + lokale @-Dateien', es: '8 idiomas + archivos @ locales', pt: '8 idiomas + arquivos @ locais' }) }}</div>
  </div>
  <div class="cw-version-card cw-version-card--latest" data-tone="green">
    <div class="cw-version-num">v0.0.13</div>
    <div class="cw-version-desc">{{ $t({ en: 'PWA + Linux + hardening', zh: 'PWA + Linux + 安全加固', ja: 'PWA + Linux + セキュリティ強化', ko: 'PWA + Linux + 보안 강화', fr: 'PWA + Linux + durcissement', de: 'PWA + Linux + Härtung', es: 'PWA + Linux + refuerzo', pt: 'PWA + Linux + reforço' }) }}</div>
  </div>
</div>

---

<div class="cw-grid"></div>
<div class="glow-orb glow-purple cw-pulse" style="top:-80px; right:25%;"></div>
<div class="glow-orb glow-green cw-pulse" style="bottom:-60px; left:30%;"></div>

<div class="cw-thanks-shell">
  <h1 class="cw-display-title">
    <span class="cw-shimmer">{{ $t({ en: 'How It\'s Built', zh: '如何构建', ja: 'どう構築したか', ko: '어떻게 만들었나', fr: 'Comment c\'est construit', de: 'Wie es gebaut ist', es: 'Cómo se construyó', pt: 'Como foi construído' }) }}</span>
  </h1>
  <p class="cw-thanks-copy">{{ $t({ en: 'Architecture decisions and engineering practices.', zh: '架构决策与工程实践。', ja: 'アーキテクチャの決定とエンジニアリングの実践。', ko: '아키텍처 결정과 엔지니어링 실천.', fr: 'Décisions d\'architecture et pratiques d\'ingénierie.', de: 'Architektur-Entscheidungen und Engineering-Praktiken.', es: 'Decisiones de arquitectura y prácticas de ingeniería.', pt: 'Decisões de arquitetura e práticas de engenharia.' }) }}</p>
</div>

---
layout: split-media
---

# 🏗 {{ $t({ en: 'Architecture at a Glance', zh: '架构概览', ja: 'アーキテクチャ概要', ko: '아키텍처 개요', fr: "Vue d'ensemble", de: 'Architektur im Überblick', es: 'Arquitectura general', pt: 'Visão geral da arquitetura' }) }}

<div class="cw-kicker" v-html="$t({ en: 'Single WebSocket, <strong>Multiple Gateways, Parallel Sessions</strong>', zh: '单 WebSocket，<strong>多 Gateway，并行会话</strong>', ja: '単一 WebSocket、<strong>複数 Gateway、並列セッション</strong>', ko: '단일 WebSocket, <strong>다중 Gateway, 병렬 세션</strong>', fr: 'Un seul WebSocket, <strong>plusieurs Gateways, sessions parallèles</strong>', de: 'Einzelner WebSocket, <strong>mehrere Gateways, parallele Sitzungen</strong>', es: 'Un solo WebSocket, <strong>múltiples Gateways, sesiones paralelas</strong>', pt: 'Um WebSocket, <strong>múltiplos Gateways, sessões paralelas</strong>' })"></div>

::left::

<img src="/images/architecture.svg" class="cw-shot cw-shot--panel" alt="ClawWork Architecture" />

::right::

<DeckMiniPanel tone="green" :title="{ en: 'Session Key', zh: '会话标识', ja: 'セッションキー', ko: '세션 키', fr: 'Clé de session', de: 'Sitzungsschlüssel', es: 'Clave de sesión', pt: 'Chave de sessão' }">
  <code>agent:&lt;id&gt;:clawwork:task:&lt;taskId&gt;</code>
</DeckMiniPanel>

<DeckMiniPanel tone="cyan" :title="{ en: 'Isolation', zh: '隔离', ja: '分離', ko: '격리', fr: 'Isolation', de: 'Isolation', es: 'Aislamiento', pt: 'Isolamento' }" :body="{ en: 'Events routed by sessionKey. No cross-talk between tasks.', zh: '事件按 sessionKey 路由。任务间互不干扰。', ja: 'イベントは sessionKey でルーティング。タスク間の干渉なし。', ko: 'sessionKey 기반 이벤트 라우팅. 태스크 간 간섭 없음.', fr: 'Événements routés par sessionKey. Aucune interférence.', de: 'Events nach sessionKey geroutet. Keine Übersprechung.', es: 'Eventos enrutados por sessionKey. Sin interferencia.', pt: 'Eventos roteados por sessionKey. Sem interferência.' }" />

<DeckMiniPanel tone="purple" :title="{ en: 'Desktop RPC', zh: '桌面端 RPC', ja: 'デスクトップ RPC', ko: '데스크톱 RPC', fr: 'RPC Bureau', de: 'Desktop-RPC', es: 'RPC de escritorio', pt: 'RPC Desktop' }">
  {{ $t({ en: 'Dedicated', zh: '专用', ja: '専用', ko: '전용', fr: 'Dédié', de: 'Dediziert', es: 'Dedicado', pt: 'Dedicado' }) }} <code>exec.approval.resolve</code>{{ $t({ en: '. Not chat messages.', zh: '。不是聊天消息。', ja: '。チャットメッセージではない。', ko: '. 채팅 메시지가 아님.', fr: '. Pas des messages chat.', de: '. Keine Chat-Nachrichten.', es: '. No son mensajes de chat.', pt: '. Não são mensagens de chat.' }) }}
</DeckMiniPanel>

---

# 🔧 {{ $t({ en: 'Tech Stack', zh: '技术栈', ja: '技術スタック', ko: '기술 스택', fr: 'Stack technique', de: 'Tech-Stack', es: 'Stack tecnológico', pt: 'Stack técnico' }) }}

<DeckTechStackSlide />

---

# ⚠️ {{ $t({ en: 'Lessons from Gateway Integration', zh: 'Gateway 集成踩坑记', ja: 'Gateway 統合の教訓', ko: 'Gateway 연동에서 얻은 교훈', fr: "Leçons de l'intégration Gateway", de: 'Lektionen der Gateway-Integration', es: 'Lecciones de la integración Gateway', pt: 'Lições da integração Gateway' }) }}

<div class="cw-kicker">{{ $t({ en: 'Things we learned the hard way, so you do not have to.', zh: '我们踩过的坑，帮你提前避开。', ja: '私たちが苦労して学んだこと。あなたはその必要がない。', ko: '우리가 힘들게 배운 것들. 여러분은 그럴 필요 없습니다.', fr: 'Ce que nous avons appris à nos dépens, pour vous éviter la même chose.', de: 'Was wir auf die harte Tour gelernt haben, damit Sie es nicht müssen.', es: 'Lo que aprendimos a la fuerza, para que tú no tengas que hacerlo.', pt: 'O que aprendemos da maneira difícil, para que você não precise.' }) }}</div>

<div class="cw-alert-grid mt-4">
  <div class="cw-alert-col">
    <div class="cw-alert-row" data-tone="red">
      <div class="cw-alert-icon">⚠</div>
      <p class="cw-alert-copy" v-html="$t({ en: '<strong>Gateway broadcasts all events.</strong> The client must filter by sessionKey.', zh: '<strong>Gateway 广播所有事件。</strong> 客户端必须按 sessionKey 过滤。', ja: '<strong>Gateway はすべてのイベントをブロードキャスト。</strong>クライアントは sessionKey でフィルタリング必須。', ko: '<strong>Gateway는 모든 이벤트를 브로드캐스트합니다.</strong> 클라이언트가 sessionKey로 필터링해야 합니다.', fr: '<strong>Gateway diffuse tous les événements.</strong> Le client doit filtrer par sessionKey.', de: '<strong>Gateway sendet alle Events.</strong> Der Client muss nach sessionKey filtern.', es: '<strong>Gateway transmite todos los eventos.</strong> El cliente debe filtrar por sessionKey.', pt: '<strong>Gateway transmite todos os eventos.</strong> O cliente deve filtrar por sessionKey.' })"></p>
    </div>
    <div class="cw-alert-row" data-tone="yellow">
      <div class="cw-alert-icon">⚠</div>
      <p class="cw-alert-copy" v-html="$t({ en: 'Streaming content may <strong>differ from history</strong> in whitespace and encoding.', zh: '流式内容可能在空白与编码上与<strong>历史记录不一致</strong>。', ja: 'ストリーミング内容は空白やエンコーディングが<strong>履歴と異なる</strong>場合がある。', ko: '스트리밍 콘텐츠는 공백과 인코딩이 <strong>이력과 다를 수 있습니다</strong>.', fr: 'Le contenu en streaming peut <strong>différer de l’historique</strong> en espaces et encodage.', de: 'Streaming-Inhalte können in Leerzeichen und Kodierung <strong>von der Historie abweichen</strong>.', es: 'El contenido en streaming puede <strong>diferir del historial</strong> en espacios y codificación.', pt: 'O conteúdo em streaming pode <strong>diferir do histórico</strong> em espaços e codificação.' })"></p>
    </div>
    <div class="cw-alert-row" data-tone="green">
      <div class="cw-alert-icon">💡</div>
      <p class="cw-alert-copy" v-html="$t({ en: '<strong>Single-writer</strong> architecture is not optional for reliable persistence.', zh: '<strong>单写者</strong>架构对可靠持久化不是可选项。', ja: '<strong>単一ライター</strong>アーキテクチャは信頼性ある永続化に必須。', ko: '<strong>단일 라이터</strong> 아키텍처는 안정적 영속성에 필수입니다.', fr: 'L’architecture <strong>écrivain unique</strong> est indispensable pour une persistance fiable.', de: '<strong>Single-Writer</strong>-Architektur ist nicht optional für zuverlässige Persistenz.', es: 'La arquitectura <strong>escritor único</strong> no es opcional para persistencia confiable.', pt: 'A arquitetura <strong>escritor único</strong> é indispensável para persistência confiável.' })"></p>
    </div>
  </div>

  <div class="cw-alert-col">
    <div class="cw-alert-row" data-tone="yellow">
      <div class="cw-alert-icon">⚠</div>
      <p class="cw-alert-copy" v-html="$t({ en: '<code>chat.history</code> has <strong>no per-message ID</strong>. Timestamps are the closest stable identifier.', zh: '<code>chat.history</code> <strong>没有逐条消息 ID</strong>。时间戳是最接近的稳定标识。', ja: '<code>chat.history</code> には<strong>メッセージ単位の ID がない</strong>。タイムスタンプが最も近い安定識別子。', ko: '<code>chat.history</code>에는 <strong>메시지별 ID가 없습니다</strong>. 타임스탬프가 가장 안정적인 식별자입니다.', fr: '<code>chat.history</code> n’a <strong>pas d’ID par message</strong>. Les timestamps sont l’identifiant stable le plus proche.', de: '<code>chat.history</code> hat <strong>keine Nachrichten-ID</strong>. Timestamps sind der stabilste Identifikator.', es: '<code>chat.history</code> <strong>no tiene ID por mensaje</strong>. Los timestamps son el identificador estable más cercano.', pt: '<code>chat.history</code> <strong>não tem ID por mensagem</strong>. Timestamps são o identificador estável mais próximo.' })"></p>
    </div>
    <div class="cw-alert-row" data-tone="green">
      <div class="cw-alert-icon">💡</div>
      <p class="cw-alert-copy" v-html="$t({ en: '<code>deliver: false</code> is essential. Otherwise messages leak into external channels.', zh: '<code>deliver: false</code> 是必须的。否则消息会泄露到外部渠道。', ja: '<code>deliver: false</code> は必須。さもないとメッセージが外部チャンネルに漏洩する。', ko: '<code>deliver: false</code>는 필수입니다. 그렇지 않으면 메시지가 외부 채널로 유출됩니다.', fr: '<code>deliver: false</code> est essentiel. Sinon les messages fuient vers les canaux externes.', de: '<code>deliver: false</code> ist unverzichtbar. Sonst gelangen Nachrichten in externe Kanäle.', es: '<code>deliver: false</code> es esencial. De lo contrario, los mensajes se filtran a canales externos.', pt: '<code>deliver: false</code> é essencial. Caso contrário, mensagens vazam para canais externos.' })"></p>
    </div>
  </div>
</div>

<p class="cw-footnote">{{ $t({ en: 'Real issues. Some already have open GitHub issues. Happy to discuss after.', zh: '都是真实问题，部分已经有 GitHub issue。会后可以继续聊。', ja: '実際の問題。一部には GitHub issue あり。後ほど議論しましょう。', ko: '실제 문제들입니다. 일부는 GitHub issue가 있습니다. 이후 논의 환영합니다.', fr: 'Vrais problèmes. Certains ont déjà des issues GitHub. Discussion bienvenue après.', de: 'Echte Probleme. Einige haben schon GitHub-Issues. Diskussion danach gerne.', es: 'Problemas reales. Algunos ya tienen issues en GitHub. Encantado de discutirlos después.', pt: 'Problemas reais. Alguns já têm issues no GitHub. Feliz em discutir depois.' }) }}</p>

---

# 🔄 {{ $t({ en: 'Dev Workflow', zh: '开发工作流', ja: '開発ワークフロー', ko: '개발 워크플로', fr: 'Workflow de dev', de: 'Entwicklungs-Workflow', es: 'Flujo de desarrollo', pt: 'Fluxo de desenvolvimento' }) }}

<div class="cw-kicker">{{ $t({ en: 'Vibe Coding: requirement → parallel worktrees → auto review → ship.', zh: 'Vibe Coding：需求 → 并行 worktree → 自动 review → 发版。', ja: 'Vibe Coding：要件 → 並列 worktree → 自動レビュー → 出荷。', ko: 'Vibe Coding: 요구사항 → 병렬 worktree → 자동 리뷰 → 배포.', fr: 'Vibe Coding : exigences → worktrees parallèles → revue auto → livraison.', de: 'Vibe Coding: Anforderung → parallele Worktrees → Auto-Review → Ship.', es: 'Vibe Coding: requisitos → worktrees paralelos → review auto → despliegue.', pt: 'Vibe Coding: requisitos → worktrees paralelos → review auto → deploy.' }) }}</div>

<DeckDevWorkflowSlide />

---

# 🛡 {{ $t({ en: 'Engineering Quality', zh: '工程质量体系', ja: 'エンジニアリング品質', ko: '엔지니어링 품질', fr: 'Qualité d’ingénierie', de: 'Engineering-Qualität', es: 'Calidad de ingeniería', pt: 'Qualidade de engenharia' }) }}

<div class="cw-kicker" v-html="$t({ en: 'Solo developer, <strong>production-grade guardrails</strong>.', zh: '一个人开发，<strong>生产级护栏</strong>。', ja: 'ソロ開発者、<strong>本番レベルのガードレール</strong>。', ko: '1인 개발자, <strong>프로덕션 수준의 가드레일</strong>.', fr: 'Développeur solo, <strong>garde-fous de production</strong>.', de: 'Solo-Entwickler, <strong>produktionsreife Leitplanken</strong>.', es: 'Desarrollador solo, <strong>barreras de calidad de producción</strong>.', pt: 'Desenvolvedor solo, <strong>guardrails de produção</strong>.' })"></div>

<DeckQualityGatesSlide />

---

# 🤝 {{ $t({ en: 'Open Source Collaboration', zh: '开源协作', ja: 'オープンソースコラボレーション', ko: '오픈소스 협업', fr: 'Collaboration open source', de: 'Open-Source-Zusammenarbeit', es: 'Colaboración open source', pt: 'Colaboração open source' }) }}

<div class="cw-kicker">{{ $t({ en: 'From first clone to merged PR.', zh: '从 clone 到 PR 合并。', ja: '最初の clone から PR マージまで。', ko: '첫 clone에서 PR 머지까지.', fr: 'Du premier clone au PR mergé.', de: 'Vom ersten Clone zum gemergten PR.', es: 'Desde el primer clone hasta el PR mergeado.', pt: 'Do primeiro clone ao PR mergeado.' }) }}</div>

<DeckOpenSourceSlide />

---

<div class="cw-grid"></div>
<div class="glow-orb glow-green cw-pulse" style="top:-80px; left:30%;"></div>
<div class="glow-orb glow-cyan cw-pulse" style="bottom:-60px; right:25%;"></div>

<div class="cw-thanks-shell">
  <h1 class="cw-display-title">
    <span class="cw-shimmer">{{ $t({ en: 'By the Numbers', zh: '数据说话', ja: '数字で語る', ko: '숫자로 말하다', fr: 'En chiffres', de: 'In Zahlen', es: 'En números', pt: 'Em números' }) }}</span>
  </h1>
  <p class="cw-thanks-copy">{{ $t({ en: 'What 15 days of vibe coding looks like.', zh: '15 天 Vibe Coding 的成果。', ja: '15日間の Vibe Coding の成果。', ko: '15일간의 Vibe Coding 결과.', fr: 'Ce que 15 jours de vibe coding donnent.', de: 'Was 15 Tage Vibe Coding ergeben.', es: 'Lo que 15 días de vibe coding producen.', pt: 'O que 15 dias de vibe coding produzem.' }) }}</p>
</div>

---

# 📈 {{ $t({ en: 'Sprint Breakdown', zh: '冲刺全景', ja: 'スプリント内訳', ko: '스프린트 분석', fr: 'Bilan du sprint', de: 'Sprint-Aufschlüsselung', es: 'Desglose del sprint', pt: 'Detalhamento do sprint' }) }}

<div class="cw-kicker">{{ $t({ en: '15 Days · 161 PRs · 13 Releases', zh: '15 天 · 161 个 PR · 13 个版本', ja: '15日間 · 161 PR · 13リリース', ko: '15일 · 161 PR · 13개 릴리스', fr: '15 jours · 161 PR · 13 releases', de: '15 Tage · 161 PRs · 13 Releases', es: '15 días · 161 PRs · 13 releases', pt: '15 dias · 161 PRs · 13 releases' }) }}</div>

<DeckVibeCodingSlide />

---

# ⭐ {{ $t({ en: 'Community Signal', zh: '社区信号', ja: 'コミュニティシグナル', ko: '커뮤니티 시그널', fr: 'Signal communautaire', de: 'Community-Signal', es: 'Señal de la comunidad', pt: 'Sinal da comunidade' }) }}

<div class="grid grid-cols-2 gap-8">
  <DeckSignalCard
    tone="yellow"
    :title="{ en: 'GitHub Star Notification', zh: 'GitHub Star 通知', ja: 'GitHub Star 通知', ko: 'GitHub Star 알림', fr: 'Notification GitHub Star', de: 'GitHub-Star-Benachrichtigung', es: 'Notificación de GitHub Star', pt: 'Notificação de GitHub Star' }"
    :note="{ en: 'The person who built OpenClaw thinks this project is worth watching.', zh: 'OpenClaw 的作者认为这个项目值得关注。', ja: 'OpenClaw の開発者がこのプロジェクトに注目した。', ko: 'OpenClaw을 만든 사람이 이 프로젝트에 주목했습니다.', fr: 'Le créateur d’OpenClaw pense que ce projet mérite attention.', de: 'Der Entwickler von OpenClaw findet dieses Projekt beachtenswert.', es: 'El creador de OpenClaw piensa que este proyecto vale la pena seguir.', pt: 'O criador do OpenClaw acha que este projeto merece atenção.' }"
  >
    <img src="/images/peter-github-star.png" class="cw-shot cw-shot--signal" alt="Peter starred ClawWork on GitHub" />
  </DeckSignalCard>

  <DeckSignalCard tone="green" :title="{ en: 'Star History', ja: 'Star 推移', ko: 'Star 히스토리', fr: 'Historique des Stars', de: 'Star-Verlauf', es: 'Historial de Stars', pt: 'Histórico de Stars' }">
    <img src="https://api.star-history.com/svg?repos=clawwork-ai/ClawWork&type=Date" class="cw-shot cw-shot--signal-full" alt="Star History Chart" />
  </DeckSignalCard>
</div>

---

<div class="cw-grid"></div>
<div class="glow-orb glow-green cw-pulse" style="top:-100px; left:30%;"></div>
<div class="glow-orb glow-purple cw-pulse" style="bottom:-80px; right:20%;"></div>

<div class="cw-thanks-shell">
  <div class="mb-8">
    <img src="/images/clawwork-logo.png" class="cw-logo-md cw-float cw-logo-glow" alt="ClawWork" />
  </div>

  <h1 class="cw-display-title">
    <span class="cw-shimmer">{{ $t({ en: 'Thanks!', zh: '谢谢！', ja: 'ありがとう！', ko: '감사합니다!', fr: 'Merci !', de: 'Danke!', es: '¡Gracias!', pt: 'Obrigado!' }) }}</span>
  </h1>

  <p class="cw-thanks-copy">{{ $t({ en: 'Questions, ideas, or PRs. All welcome.', zh: '问题、想法、PR。都欢迎。', ja: '質問、アイデア、PR。すべて歓迎。', ko: '질문, 아이디어, PR. 모두 환영합니다.', fr: 'Questions, idées ou PR. Tout est bienvenu.', de: 'Fragen, Ideen oder PRs. Alles willkommen.', es: 'Preguntas, ideas o PRs. Todo bienvenido.', pt: 'Perguntas, ideias ou PRs. Tudo é bem-vindo.' }) }}</p>

  <div class="cw-final-links">
    <a href="https://github.com/clawwork-ai/ClawWork" target="_blank" class="cw-final-link">
      <GhIcon :size="20" />
      clawwork-ai/ClawWork
    </a>
    <a href="https://github.com/samzong" target="_blank" class="cw-final-link cw-final-link--muted">
      @samzong
    </a>
  </div>

  <div class="cw-final-note">
    {{ $t({ en: 'Apache 2.0 · macOS & Windows & Linux & PWA · Built with OpenClaw', zh: 'Apache 2.0 · macOS & Windows & Linux & PWA · 基于 OpenClaw 构建', ja: 'Apache 2.0 · macOS & Windows & Linux & PWA · OpenClaw で構築', ko: 'Apache 2.0 · macOS & Windows & Linux & PWA · OpenClaw 기반', fr: 'Apache 2.0 · macOS & Windows & Linux & PWA · Construit avec OpenClaw', de: 'Apache 2.0 · macOS & Windows & Linux & PWA · Gebaut mit OpenClaw', es: 'Apache 2.0 · macOS & Windows & Linux & PWA · Hecho con OpenClaw', pt: 'Apache 2.0 · macOS & Windows & Linux & PWA · Feito com OpenClaw' }) }}
  </div>
</div>
