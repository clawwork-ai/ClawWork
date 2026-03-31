---
theme: default
title: ClawWork — The Task Workbench for OpenClaw
info: |
  ## ClawWork
  A desktop client for OpenClaw, built for parallel work.

  [GitHub](https://github.com/clawwork-ai/ClawWork)
author: samzong
keywords: openclaw,desktop,agent,parallel-tasks
highlighter: shiki
colorSchema: all
drawings:
  persist: false
transition: slide-left
favicon: /images/clawwork-logo.png
exportFilename: clawwork-keynote
---

<DeckCoverSlide />

---

# 👋 {{ $t({ en: 'About Me', zh: '关于我', ja: '自己紹介', ko: '소개', fr: 'À propos', de: 'Über mich', es: 'Sobre mí', pt: 'Sobre mim' }) }}

<DeckAboutMeSlide />

---

# 😤 {{ $t({ en: 'Pain Points of Using OpenClaw', zh: '养虾的痛点', ja: 'OpenClaw の課題', ko: 'OpenClaw 사용 시 문제점', fr: "Points faibles d'OpenClaw", de: 'Schwachstellen von OpenClaw', es: 'Problemas de OpenClaw', pt: 'Problemas do OpenClaw' }) }}

<div class="cw-kicker">{{ $t({ en: '"One window, one task, one context."', zh: '"一个窗口，一个任务，一个上下文。"', ja: '「1つのウィンドウ、1つのタスク、1つのコンテキスト」', ko: '"하나의 창, 하나의 태스크, 하나의 컨텍스트."', fr: '"Une fenêtre, une tâche, un contexte."', de: '"Ein Fenster, eine Aufgabe, ein Kontext."', es: '"Una ventana, una tarea, un contexto."', pt: '"Uma janela, uma tarefa, um contexto."' }) }}</div>

<div class="grid grid-cols-2 gap-2">
  <DeckFeatureCard
    compact
    tone="red"
    icon="🔗"
    :title="{ en: 'Serial Interaction', zh: '串行交互', ja: '逐次実行', ko: '순차적 상호작용', fr: 'Interaction séquentielle', de: 'Sequentielle Interaktion', es: 'Interacción secuencial', pt: 'Interação sequencial' }"
    :body="{ en: 'Agent is powerful, but forces one task at a time. Real work is parallel.', zh: 'Agent 很强大，但一次只能做一件事。真实工作是并行的。', ja: 'Agent は強力だが、一度に1つのタスクしかできない。実際の仕事は並列。', ko: 'Agent는 강력하지만 한 번에 하나의 태스크만 가능. 실제 업무는 병렬.', fr: 'Agent est puissant, mais impose une tâche à la fois. Le vrai travail est parallèle.', de: 'Agent ist mächtig, aber erzwingt eine Aufgabe gleichzeitig. Echte Arbeit ist parallel.', es: 'Agent es potente, pero fuerza una tarea a la vez. El trabajo real es paralelo.', pt: 'Agent é poderoso, mas força uma tarefa por vez. O trabalho real é paralelo.' }"
  />
  <DeckFeatureCard
    compact
    tone="red"
    icon="📂"
    :title="{ en: 'Scattered Artifacts', zh: '产物散落', ja: '散在するアーティファクト', ko: '흩어진 산출물', fr: 'Artefacts dispersés', de: 'Verstreute Artefakte', es: 'Artefactos dispersos', pt: 'Artefatos dispersos' }"
    :body="{ en: 'Code, files, docs scatter across conversations. Copy-paste to collect.', zh: '代码、文件、文档散落在各个对话中，靠复制粘贴收集。', ja: 'コード、ファイル、ドキュメントが会話に散在。コピペで収集。', ko: '코드, 파일, 문서가 대화에 흩어짐. 복사-붙여넣기로 수집.', fr: 'Code, fichiers, docs éparpillés entre conversations. Copier-coller pour collecter.', de: 'Code, Dateien, Docs über Gespräche verstreut. Copy-Paste zum Sammeln.', es: 'Código, archivos, docs dispersos en conversaciones. Copiar-pegar para recopilar.', pt: 'Código, arquivos, docs espalhados pelas conversas. Copiar-colar para coletar.' }"
  />
  <DeckFeatureCard
    compact
    tone="red"
    icon="🔄"
    :title="{ en: 'Context Switching', zh: '上下文切换', ja: 'コンテキスト切替', ko: '컨텍스트 전환', fr: 'Changement de contexte', de: 'Kontextwechsel', es: 'Cambio de contexto', pt: 'Troca de contexto' }"
    :body="{ en: 'Switching tabs to check status breaks flow. No structured progress tracking.', zh: '切换标签页查看状态会打断心流，没有结构化的进度追踪。', ja: 'タブ切替で状態確認するとフローが途切れる。構造化された進捗追跡がない。', ko: '탭 전환으로 상태 확인 시 흐름이 끊김. 구조화된 진행 추적 없음.', fr: 'Changer d’onglet pour vérifier l’état coupe le flux. Pas de suivi structuré.', de: 'Tab-Wechsel zum Statuscheck unterbricht den Flow. Kein strukturiertes Tracking.', es: 'Cambiar pestañas para revisar estado rompe el flujo. Sin seguimiento estructurado.', pt: 'Trocar abas para verificar status quebra o fluxo. Sem acompanhamento estruturado.' }"
  />
  <DeckFeatureCard
    compact
    tone="red"
    icon="💬"
    :title="{ en: 'Text-Only Control', zh: '纯文字控制', ja: 'テキストのみの操作', ko: '텍스트 전용 제어', fr: 'Contrôle texte uniquement', de: 'Nur-Text-Steuerung', es: 'Control solo texto', pt: 'Controle apenas texto' }"
    :body="{ en: 'Replying \'yes\' for approvals is ambiguous. No direct tool-call binding.', zh: '靠回复 yes 审批工具调用过于模糊，也没有直接的工具调用绑定。', ja: 'yes と返信して承認するのは曖昧。ツール呼び出しへの直接バインディングがない。', ko: 'yes로 답변하는 승인은 모호함. 직접적인 도구 호출 바인딩 없음.', fr: 'Répondre oui pour approuver est ambigu. Pas de liaison directe aux appels d’outils.', de: 'Mit yes genehmigen ist mehrdeutig. Keine direkte Tool-Call-Bindung.', es: 'Responder sí para aprobar es ambiguo. Sin vinculación directa a llamadas de herramientas.', pt: 'Responder yes para aprovar é ambíguo. Sem vinculação direta a chamadas de ferramentas.' }"
  />
</div>

---

# 🦐 {{ $t({ en: 'What is ClawWork', zh: 'ClawWork 是什么', ja: 'ClawWork とは', ko: 'ClawWork란', fr: "Qu'est-ce que ClawWork", de: 'Was ist ClawWork', es: 'Qué es ClawWork', pt: 'O que é o ClawWork' }) }}

<div class="cw-kicker" v-html="$t({ en: 'A desktop client for OpenClaw, <strong>built for parallel work</strong>.', zh: '一个 OpenClaw 桌面客户端，<strong>为并行工作而生</strong>。', ja: 'OpenClaw のデスクトップクライアント、<strong>並列作業のために構築</strong>。', ko: 'OpenClaw 데스크톱 클라이언트, <strong>병렬 작업을 위해 설계</strong>.', fr: 'Un client bureau pour OpenClaw, <strong>conçu pour le travail parallèle</strong>.', de: 'Ein Desktop-Client für OpenClaw, <strong>gebaut für paralleles Arbeiten</strong>.', es: 'Un cliente de escritorio para OpenClaw, <strong>diseñado para trabajo paralelo</strong>.', pt: 'Um cliente desktop para OpenClaw, <strong>feito para trabalho paralelo</strong>.' })"></div>

<div class="grid grid-cols-3 gap-6 mt-8">
  <DeckFeatureCard
    tone="green"
    icon="⚡"
    :title="{ en: 'Multi-Session', zh: '多会话', ja: 'マルチセッション', ko: '멀티 세션', fr: 'Multi-session', de: 'Multi-Sitzung', es: 'Multisesión', pt: 'Multissessão' }"
    :body="{ en: 'Multiple Agent conversations running simultaneously. No more waiting.', zh: '多个 Agent 对话同时运行，不再排队等待。', ja: '複数の Agent 会話が同時実行。もう待つ必要はない。', ko: '여러 Agent 대화가 동시에 실행. 더 이상 기다릴 필요 없음.', fr: 'Plusieurs conversations Agent en simultané. Fini l’attente.', de: 'Mehrere Agent-Gespräche gleichzeitig. Kein Warten mehr.', es: 'Múltiples conversaciones Agent simultáneas. Sin más esperas.', pt: 'Múltiplas conversas Agent simultâneas. Sem mais espera.' }"
  />
  <DeckFeatureCard
    tone="cyan"
    icon="🎯"
    :title="{ en: 'Parallel Tasks', zh: '并行任务', ja: '並列タスク', ko: '병렬 태스크', fr: 'Tâches parallèles', de: 'Parallele Aufgaben', es: 'Tareas paralelas', pt: 'Tarefas paralelas' }"
    :body="{ en: 'Each task is an independent session. Isolated context, tracked progress.', zh: '每个任务是独立会话。隔离上下文，追踪进度。', ja: '各タスクは独立したセッション。分離されたコンテキスト、追跡される進捗。', ko: '각 태스크는 독립된 세션. 격리된 컨텍스트, 추적되는 진행.', fr: 'Chaque tâche est une session indépendante. Contexte isolé, progression suivie.', de: 'Jede Aufgabe ist eine unabhängige Sitzung. Isolierter Kontext, verfolgter Fortschritt.', es: 'Cada tarea es una sesión independiente. Contexto aislado, progreso rastreado.', pt: 'Cada tarefa é uma sessão independente. Contexto isolado, progresso rastreado.' }"
  />
  <DeckFeatureCard
    tone="purple"
    icon="📦"
    :title="{ en: 'File Management', zh: '文件管理', ja: 'ファイル管理', ko: '파일 관리', fr: 'Gestion de fichiers', de: 'Dateiverwaltung', es: 'Gestión de archivos', pt: 'Gestão de ficheiros' }"
    :body="{ en: 'Every Agent output is automatically collected, browsable, and searchable.', zh: '所有 Agent 产出自动收集，可浏览，可搜索。', ja: 'すべての Agent 出力を自動収集、閲覧・検索可能。', ko: '모든 Agent 출력을 자동 수집, 탐색 및 검색 가능.', fr: 'Chaque sortie Agent est automatiquement collectée, navigable et recherchable.', de: 'Jede Agent-Ausgabe wird automatisch gesammelt, durchsuchbar und navigierbar.', es: 'Cada salida del Agent se recopila automáticamente, navegable y buscable.', pt: 'Cada saída do Agent é coletada automaticamente, navegável e pesquisável.' }"
  />
</div>

<div class="cw-badge-row">
  <span class="cw-badge" data-tone="cyan">{{ $t({ en: 'ZERO SERVER CHANGES', zh: '零服务端改动', ja: 'サーバー変更ゼロ', ko: '서버 변경 불필요', fr: 'ZÉRO MODIFICATION SERVEUR', de: 'KEINE SERVER-ÄNDERUNGEN', es: 'CERO CAMBIOS EN SERVIDOR', pt: 'ZERO ALTERAÇÕES NO SERVIDOR' }) }}</span>
  <span class="cw-badge-copy">{{ $t({ en: 'Connects via standard Gateway protocol', zh: '通过标准 Gateway 协议连接', ja: '標準 Gateway プロトコルで接続', ko: '표준 Gateway 프로토콜로 연결', fr: 'Connexion via le protocole Gateway standard', de: 'Verbindung über Standard-Gateway-Protokoll', es: 'Conecta mediante protocolo Gateway estándar', pt: 'Conecta via protocolo Gateway padrão' }) }}</span>
</div>

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
layout: split-media
---

# 🖥 {{ $t({ en: 'Three-Panel Layout', zh: '三栏布局', ja: '3ペインレイアウト', ko: '3패널 레이아웃', fr: 'Disposition en trois panneaux', de: 'Drei-Panel-Layout', es: 'Diseño de tres paneles', pt: 'Layout de três painéis' }) }}

<div class="cw-kicker">{{ $t({ en: 'Left, Center, Right. Everything visible at once.', zh: '左、中、右。一目了然。', ja: '左・中央・右。すべてが一目で見える。', ko: '왼쪽, 가운데, 오른쪽. 한눈에 모든 것을.', fr: 'Gauche, centre, droite. Tout visible en un coup d’œil.', de: 'Links, Mitte, Rechts. Alles auf einen Blick.', es: 'Izquierda, centro, derecha. Todo visible de un vistazo.', pt: 'Esquerda, centro, direita. Tudo visível de uma vez.' }) }}</div>

::left::

<img src="/images/three-panel-full.png" class="cw-shot cw-shot--panel" alt="ClawWork three-panel layout" />

::right::

<DeckMiniPanel neutral tone="green" :title="{ en: 'Left Nav', zh: '左侧导航', ja: '左ナビ', ko: '좌측 네비', fr: 'Nav gauche', de: 'Linke Nav', es: 'Nav izquierda', pt: 'Nav esquerda' }" :body="{ en: 'Task list, gateway selector, cron jobs.', zh: '任务列表、网关选择、定时任务。', ja: 'タスク一覧、Gateway 選択、定時ジョブ。', ko: '태스크 목록, Gateway 선택, 크론 작업.', fr: 'Liste des tâches, sélecteur Gateway, tâches planifiées.', de: 'Aufgabenliste, Gateway-Auswahl, Cron-Jobs.', es: 'Lista de tareas, selector Gateway, tareas programadas.', pt: 'Lista de tarefas, seletor Gateway, tarefas agendadas.' }" />

<DeckMiniPanel neutral tone="cyan" :title="{ en: 'Center', zh: '中央面板', ja: '中央パネル', ko: '중앙 패널', fr: 'Centre', de: 'Zentral', es: 'Centro', pt: 'Centro' }" :body="{ en: 'Chat with streaming, tool cards, approval prompts.', zh: '流式聊天、工具卡片、审批提示。', ja: 'ストリーミングチャット、ツールカード、承認プロンプト。', ko: '스트리밍 채팅, 도구 카드, 승인 프롬프트.', fr: 'Chat en streaming, cartes d’outils, invites d’approbation.', de: 'Streaming-Chat, Tool-Karten, Genehmigungsdialoge.', es: 'Chat en streaming, tarjetas de herramientas, aprobaciones.', pt: 'Chat em streaming, cards de ferramentas, aprovações.' }" />

<DeckMiniPanel neutral tone="purple" :title="{ en: 'Right Panel', zh: '右侧面板', ja: '右パネル', ko: '우측 패널', fr: 'Panneau droit', de: 'Rechtes Panel', es: 'Panel derecho', pt: 'Painel direito' }" :body="{ en: 'Progress tracking and artifact browser.', zh: '进度追踪和产物浏览。', ja: '進捗追跡とアーティファクトブラウザ。', ko: '진행 상황 추적 및 아티팩트 브라우저.', fr: 'Suivi de progression et navigateur d’artefacts.', de: 'Fortschrittsverfolgung und Artefakt-Browser.', es: 'Seguimiento de progreso y explorador de artefactos.', pt: 'Acompanhamento de progresso e navegador de artefatos.' }" />

---
layout: split-media
---

# ⚡ {{ $t({ en: 'Multi-Session in Action', zh: '多会话实战', ja: 'マルチセッション実践', ko: '멀티 세션 실전', fr: 'Multi-session en action', de: 'Multi-Sitzung in Aktion', es: 'Multisesión en acción', pt: 'Multissessão em ação' }) }}

<div class="cw-kicker">{{ $t({ en: 'Three tasks running in parallel. Each with isolated context.', zh: '三个任务并行运行。各自独立上下文。', ja: '3つのタスクが並列実行。各自独立したコンテキスト。', ko: '3개 태스크가 병렬 실행. 각각 독립된 컨텍스트.', fr: 'Trois tâches en parallèle. Chacune avec son contexte isolé.', de: 'Drei Aufgaben parallel. Jeweils mit isoliertem Kontext.', es: 'Tres tareas en paralelo. Cada una con contexto aislado.', pt: 'Três tarefas em paralelo. Cada uma com contexto isolado.' }) }}</div>

::left::

<img src="/images/multi-session-parallel.png" class="cw-shot cw-shot--panel" alt="Three tasks running in parallel" />

::right::

<DeckMiniStatRow tone="green" :text="{ en: 'Status badges: running, idle, done', zh: '状态徽章：运行中、空闲、完成', ja: 'ステータスバッジ：実行中、待機、完了', ko: '상태 배지: 실행 중, 대기, 완료', fr: 'Badges d’état : en cours, inactif, terminé', de: 'Status-Badges: laufend, idle, fertig', es: 'Insignias de estado: en ejecución, inactivo, terminado', pt: 'Badges de status: executando, inativo, concluído' }" />
<DeckMiniStatRow tone="cyan" :text="{ en: 'Animated spinners for active sessions', zh: '活跃会话的动画指示器', ja: 'アクティブセッションのアニメーションスピナー', ko: '활성 세션용 애니메이션 스피너', fr: 'Spinners animés pour les sessions actives', de: 'Animierte Spinner für aktive Sitzungen', es: 'Spinners animados para sesiones activas', pt: 'Spinners animados para sessões ativas' }" />
<DeckMiniStatRow tone="purple" :text="{ en: 'Unread indicators per task', zh: '每个任务的未读提示', ja: 'タスクごとの未読インジケーター', ko: '태스크별 미읽음 표시', fr: 'Indicateurs non lus par tâche', de: 'Ungelesen-Anzeige pro Aufgabe', es: 'Indicadores no leídos por tarea', pt: 'Indicadores de não lido por tarefa' }" />
<DeckMiniStatRow tone="yellow" :text="{ en: 'Relative timestamps', zh: '相对时间戳', ja: '相対タイムスタンプ', ko: '상대 타임스탬프', fr: 'Horodatages relatifs', de: 'Relative Zeitstempel', es: 'Marcas de tiempo relativas', pt: 'Timestamps relativos' }" />

---

# 📂 {{ $t({ en: 'File Management', zh: '文件管理', ja: 'ファイル管理', ko: '파일 관리', fr: 'Gestion de fichiers', de: 'Dateiverwaltung', es: 'Gestión de archivos', pt: 'Gestão de ficheiros' }) }}

<div class="cw-kicker">{{ $t({ en: 'Every file the Agent produces, automatically collected.', zh: 'Agent 产出的每一个文件，自动收集。', ja: 'Agent が生成するすべてのファイルを自動収集。', ko: 'Agent가 생성하는 모든 파일을 자동 수집.', fr: 'Chaque fichier produit par l’Agent, automatiquement collecté.', de: 'Jede vom Agent erzeugte Datei, automatisch gesammelt.', es: 'Cada archivo que produce el Agent, recopilado automáticamente.', pt: 'Cada arquivo produzido pelo Agent, coletado automaticamente.' }) }}</div>

<div class="cw-split--media mt-6">
  <div class="flex flex-col gap-3">
    <h3 class="cw-panel-title cw-tone-green">{{ $t({ en: 'File Browser', zh: '文件浏览器', ja: 'ファイルブラウザ', ko: '파일 브라우저', fr: 'Navigateur de fichiers', de: 'Dateibrowser', es: 'Explorador de archivos', pt: 'Navegador de arquivos' }) }}</h3>
    <img src="/images/file-browser.png" class="cw-shot cw-shot--browser" alt="Artifact file browser" />
  </div>

  <div class="flex flex-col gap-3">
    <h3 class="cw-panel-title cw-tone-green">{{ $t({ en: 'Features', zh: '功能特性', ja: '機能', ko: '기능', fr: 'Fonctionnalités', de: 'Funktionen', es: 'Funciones', pt: 'Funcionalidades' }) }}</h3>
    <ul class="cw-bullets">
      <li>{{ $t({ en: 'Grid layout with type badges', zh: '网格布局与类型徽章', ja: 'タイプバッジ付きグリッドレイアウト', ko: '타입 배지가 포함된 그리드 레이아웃', fr: 'Disposition grille avec badges de type', de: 'Rasterlayout mit Typ-Badges', es: 'Diseño en cuadrícula con insignias de tipo', pt: 'Layout em grade com badges de tipo' }) }}</li>
      <li>{{ $t({ en: 'Filter by task, sort by date, name, or type', zh: '按任务筛选，按日期、名称或类型排序', ja: 'タスクで絞込、日付・名前・タイプで並替', ko: '태스크별 필터, 날짜·이름·타입별 정렬', fr: 'Filtrer par tâche, trier par date, nom ou type', de: 'Nach Aufgabe filtern, nach Datum, Name oder Typ sortieren', es: 'Filtrar por tarea, ordenar por fecha, nombre o tipo', pt: 'Filtrar por tarefa, ordenar por data, nome ou tipo' }) }}</li>
      <li>{{ $t({ en: 'Full-text search with highlighted snippets', zh: '全文搜索与高亮片段', ja: 'ハイライト付き全文検索', ko: '하이라이트가 포함된 전문 검색', fr: 'Recherche plein texte avec extraits surlignés', de: 'Volltextsuche mit hervorgehobenen Snippets', es: 'Búsqueda de texto completo con fragmentos resaltados', pt: 'Busca textual com trechos destacados' }) }}</li>
      <li>{{ $t({ en: 'Each artifact links back to its source message', zh: '每个产物都能回链到源消息', ja: '各アーティファクトがソースメッセージにリンク', ko: '각 아티팩트가 원본 메시지에 연결', fr: 'Chaque artefact renvoie à son message source', de: 'Jedes Artefakt verlinkt zum Quellnachricht', es: 'Cada artefacto enlaza a su mensaje de origen', pt: 'Cada artefato vincula à mensagem de origem' }) }}</li>
      <li>{{ $t({ en: 'Per-task artifact list in the right panel', zh: '右侧面板显示任务产物列表', ja: '右パネルにタスクごとのアーティファクト一覧', ko: '우측 패널에 태스크별 아티팩트 목록', fr: 'Liste d’artefacts par tâche dans le panneau droit', de: 'Artefakt-Liste pro Aufgabe im rechten Panel', es: 'Lista de artefactos por tarea en el panel derecho', pt: 'Lista de artefatos por tarefa no painel direito' }) }}</li>
    </ul>
    <div class="cw-note-panel" data-tone="green">
      <p class="cw-note-copy" v-html="$t({ en: '<strong>No copy-paste.</strong> No more wondering where the file went. It is all here.', zh: '<strong>告别复制粘贴。</strong> 不再纠结文件到底去哪了。它都在这里。', ja: '<strong>コピペ不要。</strong>ファイルの行方に悩む必要はもうありません。すべてここに。', ko: '<strong>복사-붙여넣기 불필요.</strong> 파일이 어디 갔는지 고민할 필요 없습니다. 모두 여기에.', fr: '<strong>Fini le copier-coller.</strong> Plus besoin de chercher où est passé le fichier. Tout est ici.', de: '<strong>Kein Copy-Paste.</strong> Nie mehr fragen, wo die Datei hin ist. Alles hier.', es: '<strong>Sin copiar-pegar.</strong> No más preguntarse dónde fue el archivo. Todo está aquí.', pt: '<strong>Sem copiar-colar.</strong> Sem mais dúvidas sobre onde o arquivo foi parar. Tudo aqui.' })"></p>
    </div>
  </div>
</div>

---

# 📊 {{ $t({ en: 'Task Progress Tracking', zh: '任务进度追踪', ja: 'タスク進捗追跡', ko: '태스크 진행 추적', fr: 'Suivi de progression des tâches', de: 'Aufgaben-Fortschrittsverfolgung', es: 'Seguimiento de progreso de tareas', pt: 'Acompanhamento de progresso de tarefas' }) }}

<DeckTaskProgressSlide />

---
layout: split-media
gap: mt-6
---

# 🧠 {{ $t({ en: 'Token & Context Awareness', zh: 'Token 与上下文感知', ja: 'Token とコンテキスト管理', ko: 'Token 및 컨텍스트 인식', fr: 'Gestion Token et contexte', de: 'Token- & Kontext-Bewusstsein', es: 'Gestión de Token y contexto', pt: 'Gestão de Token e contexto' }) }}

<div class="cw-kicker">{{ $t({ en: 'You always know how much runway you have.', zh: '你始终知道还剩多少空间。', ja: '残りの余裕が常にわかる。', ko: '남은 여유가 항상 보입니다.', fr: 'Vous savez toujours combien de marge il vous reste.', de: 'Sie wissen immer, wie viel Spielraum noch bleibt.', es: 'Siempre sabes cuánto margen te queda.', pt: 'Você sempre sabe quanto espaço resta.' }) }}</div>

::left::

<img src="/images/token-usage.png" class="cw-shot cw-shot--browser" alt="Token usage dashboard" />

::right::

<ul class="cw-bullets">
  <li>{{ $t({ en: 'Chat header shows real-time token counts for input and output', zh: '聊天头部实时显示输入与输出 Token 计数', ja: 'チャットヘッダーに入出力 Token 数をリアルタイム表示', ko: '채팅 헤더에 입출력 Token 수 실시간 표시', fr: 'L’en-tête du chat affiche les compteurs Token en temps réel', de: 'Chat-Header zeigt Echtzeit-Token-Zähler für Ein-/Ausgabe', es: 'El encabezado del chat muestra contadores de Token en tiempo real', pt: 'O cabeçalho do chat mostra contadores de Token em tempo real' }) }}</li>
  <li>{{ $t({ en: 'Context usage bar with color thresholds', zh: '上下文用量条带颜色阈值', ja: 'カラー閾値付きコンテキスト使用量バー', ko: '색상 임계값이 있는 컨텍스트 사용량 바', fr: 'Barre d’utilisation du contexte avec seuils de couleur', de: 'Kontext-Nutzungsbalken mit Farbschwellen', es: 'Barra de uso de contexto con umbrales de color', pt: 'Barra de uso de contexto com limites de cor' }) }}</li>
  <li>{{ $t({ en: 'Cost displayed in real currency, not abstract credits', zh: '费用以真实货币显示，而非抽象积分', ja: '抽象的なクレジットではなく実通貨でコスト表示', ko: '추상적 크레딧이 아닌 실제 통화로 비용 표시', fr: 'Coût affiché en monnaie réelle, pas en crédits abstraits', de: 'Kosten in Echtgeld, nicht in abstrakten Credits', es: 'Costo mostrado en moneda real, no en créditos abstractos', pt: 'Custo exibido em moeda real, não créditos abstratos' }) }}</li>
  <li>{{ $t({ en: 'Rate limit status with progress bars', zh: '速率限制状态配合进度条展示', ja: 'レート制限ステータスとプログレスバー', ko: '속도 제한 상태와 프로그레스 바', fr: 'État de limite de débit avec barres de progression', de: 'Rate-Limit-Status mit Fortschrittsbalken', es: 'Estado de límite de tasa con barras de progreso', pt: 'Status de limite de taxa com barras de progresso' }) }}</li>
  <li>{{ $t({ en: 'Expandable thinking process viewer', zh: '可展开的思考过程查看器', ja: '展開可能な思考プロセスビューア', ko: '펼칠 수 있는 사고 과정 뷰어', fr: 'Visualiseur de processus de réflexion extensible', de: 'Aufklappbarer Denkprozess-Viewer', es: 'Visor de proceso de pensamiento expandible', pt: 'Visualizador de processo de raciocínio expansível' }) }}</li>
</ul>

<div class="cw-note-panel" data-tone="green">
  <p class="cw-note-copy" v-html="$t({ en: '<strong>Transparency is not a feature.</strong> It is respect for the user.', zh: '<strong>透明不是功能。</strong> 它是对用户的尊重。', ja: '<strong>透明性は機能ではない。</strong>ユーザーへの敬意である。', ko: '<strong>투명성은 기능이 아닙니다.</strong> 사용자에 대한 존중입니다.', fr: '<strong>La transparence n’est pas une fonctionnalité.</strong> C’est du respect pour l’utilisateur.', de: '<strong>Transparenz ist kein Feature.</strong> Es ist Respekt gegenüber dem Nutzer.', es: '<strong>La transparencia no es una función.</strong> Es respeto al usuario.', pt: '<strong>Transparência não é uma funcionalidade.</strong> É respeito ao usuário.' })"></p>
</div>

---

# 🧩 {{ $t({ en: 'Feature Matrix', zh: '功能大全', ja: '機能一覧', ko: '기능 매트릭스', fr: 'Matrice de fonctionnalités', de: 'Funktionsmatrix', es: 'Matriz de funciones', pt: 'Matriz de funcionalidades' }) }}

<div class="cw-kicker">{{ $t({ en: '21 shipped capabilities. 1 next up.', zh: '21 项已发布能力，1 项正在路上。', ja: '21機能を出荷済み。次は1つ。', ko: '출시 완료 21개 기능. 다음은 1개.', fr: '21 capacités livrées. 1 en approche.', de: '21 ausgelieferte Funktionen. 1 als Nächstes.', es: '21 capacidades ya entregadas. 1 siguiente.', pt: '21 capacidades já entregues. 1 a seguir.' }) }}</div>

<DeckFeatureMatrixSlide />

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
