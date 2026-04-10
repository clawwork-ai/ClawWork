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

<div class="cw-grid"></div>
<div class="glow-orb glow-purple cw-pulse" style="top:-80px; right:30%;"></div>
<div class="glow-orb glow-cyan cw-pulse" style="bottom:-60px; left:25%;"></div>

<div class="cw-thanks-shell">
  <h1 class="cw-display-title">
    <span class="cw-shimmer">{{ $t({ en: 'Why?', zh: '为什么？', ja: 'なぜ？', ko: '왜?', fr: 'Pourquoi ?', de: 'Warum?', es: '¿Por qué?', pt: 'Por quê?' }) }}</span>
  </h1>
  <p class="cw-thanks-copy">{{ $t({ en: 'The problem with the current workflow.', zh: '当前工作流的问题。', ja: '現在のワークフローの問題。', ko: '현재 워크플로의 문제.', fr: 'Le problème du workflow actuel.', de: 'Das Problem mit dem aktuellen Workflow.', es: 'El problema con el flujo actual.', pt: 'O problema com o fluxo atual.' }) }}</p>
</div>

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

<div class="cw-grid"></div>
<div class="glow-orb glow-green cw-pulse" style="top:-80px; right:20%;"></div>
<div class="glow-orb glow-cyan cw-pulse" style="bottom:-60px; left:35%;"></div>

<div class="cw-thanks-shell">
  <h1 class="cw-display-title">
    <span class="cw-shimmer">{{ $t({ en: 'The Answer', zh: '答案', ja: '答え', ko: '해답', fr: 'La Réponse', de: 'Die Antwort', es: 'La Respuesta', pt: 'A Resposta' }) }}</span>
  </h1>
  <p class="cw-thanks-copy">{{ $t({ en: 'Meet ClawWork.', zh: 'ClawWork 登场。', ja: 'ClawWork の登場。', ko: 'ClawWork 등장.', fr: 'Voici ClawWork.', de: 'Hier kommt ClawWork.', es: 'Presentamos ClawWork.', pt: 'Apresentando ClawWork.' }) }}</p>
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

# 🖥 {{ $t({ en: 'Overview', zh: '一览', ja: '概観', ko: '한눈에', fr: 'Vue d’ensemble', de: 'Überblick', es: 'Vista general', pt: 'Visão geral' }) }}

<div class="cw-kicker">{{ $t({ en: 'All three pillars in one workbench.', zh: '三大支柱，一个工作台。', ja: '3つの柱を1つのワークベンチに。', ko: '세 가지 기둥을 하나의 워크벤치에.', fr: 'Les trois piliers en un seul atelier.', de: 'Alle drei Säulen in einer Werkbank.', es: 'Los tres pilares en un solo banco.', pt: 'Os três pilares em uma bancada.' }) }}</div>

<div style="display: flex; justify-content: center; margin-top: 16px;">
  <img src="/images/clawwork-screenshot.png" class="cw-shot cw-shot--hero" alt="ClawWork overview" />
</div>

---

<div class="cw-grid"></div>
<div class="glow-orb glow-cyan cw-pulse" style="top:-80px; left:35%;"></div>
<div class="glow-orb glow-purple cw-pulse" style="bottom:-60px; right:20%;"></div>

<div class="cw-thanks-shell">
  <h1 class="cw-display-title">
    <span class="cw-shimmer">{{ $t({ en: 'Product Tour', zh: '产品之旅', ja: 'プロダクトツアー', ko: '제품 투어', fr: 'Visite du produit', de: 'Produkt-Tour', es: 'Tour del producto', pt: 'Tour do produto' }) }}</span>
  </h1>
  <p class="cw-thanks-copy">{{ $t({ en: 'What it looks like inside.', zh: '看看里面长什么样。', ja: '中身を見てみよう。', ko: '내부를 살펴봅시다.', fr: 'À quoi ça ressemble à l\'intérieur.', de: 'Wie es von innen aussieht.', es: 'Cómo se ve por dentro.', pt: 'Como é por dentro.' }) }}</p>
</div>

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

<div class="cw-kicker">{{ $t({ en: 'Everything that has shipped. At a glance.', zh: '已经发布的一切。一目了然。', ja: '出荷済みの全機能。一目で。', ko: '출시된 모든 기능. 한눈에.', fr: 'Tout ce qui a été livré. En un coup d’œil.', de: 'Alles, was ausgeliefert wurde. Auf einen Blick.', es: 'Todo lo que ya se ha entregado. De un vistazo.', pt: 'Tudo o que já foi entregue. Num olhar.' }) }}</div>

<DeckFeatureMatrixSlide />

---
layout: split-media
---

# 🧩 {{ $t({ en: 'Skills & ClawHub', zh: 'Skills 与 ClawHub', ja: 'Skills と ClawHub', ko: 'Skills & ClawHub', fr: 'Skills & ClawHub', de: 'Skills & ClawHub', es: 'Skills y ClawHub', pt: 'Skills e ClawHub' }) }}

<div class="cw-kicker">{{ $t({ en: 'Atomic capabilities. Discover, install, configure.', zh: '原子能力。发现、安装、配置。', ja: 'アトミックな能力。発見・インストール・設定。', ko: '원자 능력. 발견, 설치, 설정.', fr: 'Capacités atomiques. Découvrir, installer, configurer.', de: 'Atomare Fähigkeiten. Entdecken, installieren, konfigurieren.', es: 'Capacidades atómicas. Descubre, instala, configura.', pt: 'Capacidades atômicas. Descubra, instale, configure.' }) }}</div>

::left::

<img src="/images/skills.png" class="cw-shot cw-shot--panel" alt="Skills settings" />

::right::

<DeckMiniPanel tone="green" :title="{ en: 'Skill', zh: 'Skill', ja: 'Skill', ko: 'Skill', fr: 'Skill', de: 'Skill', es: 'Skill', pt: 'Skill' }" :body="{ en: 'Reusable capability fragment. Extends what an Agent can do.', zh: '可复用的能力片段。扩展 Agent 的工具箱。', ja: '再利用可能な能力断片。Agent のツールボックスを拡張。', ko: '재사용 능력 조각. Agent 도구 상자를 확장.', fr: 'Fragment réutilisable. Étend la boîte à outils.', de: 'Wiederverwendbares Fragment. Erweitert die Toolbox.', es: 'Fragmento reutilizable. Amplía la caja de herramientas.', pt: 'Fragmento reutilizável. Expande a caixa de ferramentas.' }" />

<DeckMiniPanel tone="cyan" :title="{ en: 'ClawHub', zh: 'ClawHub', ja: 'ClawHub', ko: 'ClawHub', fr: 'ClawHub', de: 'ClawHub', es: 'ClawHub', pt: 'ClawHub' }" :body="{ en: 'An app store for agent skills. One click adds the capability.', zh: 'Agent 能力的应用商店。一键添加新技能。', ja: 'Agent 能力のアプリストア。ワンクリックで追加。', ko: 'Agent 능력의 앱스토어. 원클릭 설치.', fr: 'App store pour skills. Un clic suffit.', de: 'App Store für Skills. Ein Klick genügt.', es: 'Tienda de skills. Un clic.', pt: 'Loja de skills. Um clique.' }" />

<DeckMiniPanel tone="purple" :title="{ en: 'Schema-Driven', zh: 'Schema 驱动', ja: 'スキーマ駆動', ko: '스키마 기반', fr: 'Guidé par schéma', de: 'Schema-basiert', es: 'Por esquema', pt: 'Por schema' }" :body="{ en: 'Skills self-describe their config. The UI generates the form.', zh: 'Skill 自描述配置，UI 自动生成表单。', ja: 'Skill が設定を記述。UI が自動生成。', ko: 'Skill이 설정 기술. UI가 폼 자동 생성.', fr: 'Les skills décrivent leur config. UI auto-générée.', de: 'Skills beschreiben sich selbst. UI wird generiert.', es: 'Los skills se describen. UI generada.', pt: 'Skills se descrevem. UI gerada.' }" />

---
layout: split-media
---

# 🤖 {{ $t({ en: 'Agent Manager', zh: 'Agent 管理', ja: 'Agent マネージャー', ko: 'Agent 매니저', fr: 'Gestionnaire d’Agent', de: 'Agent-Verwaltung', es: 'Gestor de Agent', pt: 'Gerenciador de Agent' }) }}

<div class="cw-kicker">{{ $t({ en: 'All your agents in one place. Edit anything in-app.', zh: '所有 Agent 一处管理。所有配置产品内编辑。', ja: 'すべての Agent を一箇所で管理。すべての設定をアプリ内で編集。', ko: '모든 Agent를 한곳에서 관리. 모든 설정을 앱 내에서 편집.', fr: 'Tous vos agents au même endroit. Tout éditable dans l’app.', de: 'Alle Agents an einem Ort. Alles in der App bearbeitbar.', es: 'Todos tus agents en un solo lugar. Todo editable en la app.', pt: 'Todos os seus agents em um só lugar. Tudo editável no app.' }) }}</div>

::left::

<img src="/images/agents-list.png" class="cw-shot cw-shot--panel" alt="Agents list" />

::right::

<ul class="cw-bullets">
  <li v-html="$t({ en: '<strong>One panel</strong>: every Agent, every Skill, every status', zh: '<strong>一个面板</strong>：所有 Agent、所有 Skill、所有状态', ja: '<strong>1つのパネル</strong>：すべての Agent、Skill、ステータス', ko: '<strong>하나의 패널</strong>: 모든 Agent, Skill, 상태', fr: '<strong>Un seul panneau</strong> : chaque Agent, chaque Skill, chaque statut', de: '<strong>Ein Panel</strong>: jeder Agent, jeder Skill, jeder Status', es: '<strong>Un panel</strong>: cada Agent, cada Skill, cada estado', pt: '<strong>Um painel</strong>: cada Agent, cada Skill, cada status' })"></li>
  <li v-html="$t({ en: '<strong>Inline file editor</strong>: edit <code>AGENTS.md</code> and skill configs without leaving the app', zh: '<strong>内联文件编辑器</strong>：无需离开产品就能编辑 <code>AGENTS.md</code> 和 Skill 配置', ja: '<strong>インラインファイル編集</strong>：アプリを離れずに <code>AGENTS.md</code> や Skill 設定を編集', ko: '<strong>인라인 파일 편집</strong>: 앱을 벗어나지 않고 <code>AGENTS.md</code>와 Skill 설정 편집', fr: '<strong>Éditeur inline</strong> : modifiez <code>AGENTS.md</code> et les configs de skill sans quitter l’app', de: '<strong>Inline-Datei-Editor</strong>: <code>AGENTS.md</code> und Skill-Configs ohne App-Wechsel editieren', es: '<strong>Editor inline</strong>: edita <code>AGENTS.md</code> y configs de skill sin salir de la app', pt: '<strong>Editor inline</strong>: edite <code>AGENTS.md</code> e configs de skill sem sair do app' })"></li>
  <li v-html="$t({ en: '<strong>Custom avatars</strong> via <code>clawwork-avatar://</code> protocol', zh: '<strong>自定义头像</strong>，走 <code>clawwork-avatar://</code> 协议', ja: '<strong>カスタムアバター</strong>：<code>clawwork-avatar://</code> プロトコル', ko: '<strong>커스텀 아바타</strong>: <code>clawwork-avatar://</code> 프로토콜', fr: '<strong>Avatars personnalisés</strong> via le protocole <code>clawwork-avatar://</code>', de: '<strong>Eigene Avatare</strong> über <code>clawwork-avatar://</code>-Protokoll', es: '<strong>Avatares personalizados</strong> vía <code>clawwork-avatar://</code>', pt: '<strong>Avatares customizados</strong> via protocolo <code>clawwork-avatar://</code>' })"></li>
  <li v-html="$t({ en: '<strong>Skills status</strong>: see at a glance which skills are enabled per Agent', zh: '<strong>Skill 状态</strong>：一眼看清每个 Agent 启用了哪些 Skill', ja: '<strong>Skill ステータス</strong>：Agent ごとに有効な Skill が一目でわかる', ko: '<strong>Skill 상태</strong>: Agent별 활성화된 Skill을 한눈에', fr: '<strong>Statut Skills</strong> : les skills activés par Agent en un coup d’œil', de: '<strong>Skills-Status</strong>: aktivierte Skills pro Agent auf einen Blick', es: '<strong>Estado de Skills</strong>: skills activos por Agent de un vistazo', pt: '<strong>Status de Skills</strong>: veja num olhar quais skills estão ativos por Agent' })"></li>
</ul>

---
layout: split-media
---

# 🧙 {{ $t({ en: 'Agent Builder', zh: 'Agent 构建器', ja: 'Agent ビルダー', ko: 'Agent 빌더', fr: 'Agent Builder', de: 'Agent-Builder', es: 'Agent Builder', pt: 'Agent Builder' }) }}

<div class="cw-kicker">{{ $t({ en: 'Talk your way to a new Agent.', zh: '对话即可创建新 Agent。', ja: '対話で新しい Agent を作成。', ko: '대화로 새 Agent 생성.', fr: 'Créez un Agent en conversation.', de: 'Einen Agent per Gespräch erstellen.', es: 'Crea un Agent conversando.', pt: 'Crie um Agent conversando.' }) }}</div>

::left::

<img src="/images/agent-builder.png" class="cw-shot cw-shot--panel" alt="Agent Builder dialog" />

::right::

<ul class="cw-bullets">
  <li v-html="$t({ en: '<strong>Describe</strong> what the Agent should do — natural language', zh: '<strong>描述</strong> Agent 应该做什么 —— 自然语言', ja: '<strong>説明する</strong> Agent の役割を —— 自然言語で', ko: '<strong>설명</strong> Agent가 할 일을 —— 자연어로', fr: '<strong>Décrivez</strong> ce que l’Agent doit faire — en langage naturel', de: '<strong>Beschreibe</strong>, was der Agent tun soll — natürliche Sprache', es: '<strong>Describe</strong> qué debe hacer el Agent — lenguaje natural', pt: '<strong>Descreva</strong> o que o Agent deve fazer — linguagem natural' })"></li>
  <li v-html="$t({ en: '<strong>ClawWork drafts</strong> the <code>AGENT.md</code>, picks Skills, sets the model', zh: '<strong>ClawWork 起草</strong> <code>AGENT.md</code>，选择 Skill，设定模型', ja: '<strong>ClawWork が下書き</strong>：<code>AGENT.md</code>、Skill 選択、モデル設定', ko: '<strong>ClawWork가 초안 작성</strong>: <code>AGENT.md</code>, Skill 선택, 모델 설정', fr: '<strong>ClawWork ébauche</strong> le <code>AGENT.md</code>, choisit les Skills, fixe le modèle', de: '<strong>ClawWork entwirft</strong> <code>AGENT.md</code>, wählt Skills, setzt das Modell', es: '<strong>ClawWork redacta</strong> el <code>AGENT.md</code>, elige Skills, fija el modelo', pt: '<strong>ClawWork rascunha</strong> o <code>AGENT.md</code>, escolhe Skills, define o modelo' })"></li>
  <li v-html="$t({ en: '<strong>Tweak inline</strong> before saving — every field is editable', zh: '<strong>保存前内联微调</strong> —— 每个字段都可编辑', ja: '<strong>保存前にインライン調整</strong> —— すべてのフィールドが編集可能', ko: '<strong>저장 전 인라인 조정</strong> —— 모든 필드 편집 가능', fr: '<strong>Affinez inline</strong> avant de sauvegarder — chaque champ est éditable', de: '<strong>Inline anpassen</strong> vor dem Speichern — jedes Feld ist editierbar', es: '<strong>Ajusta inline</strong> antes de guardar — cada campo es editable', pt: '<strong>Ajuste inline</strong> antes de salvar — cada campo é editável' })"></li>
  <li v-html="$t({ en: '<strong>Save</strong> — Agent appears in the manager, ready for tasks', zh: '<strong>保存</strong> —— Agent 出现在管理面板，准备接任务', ja: '<strong>保存</strong> —— Agent がマネージャーに出現、タスク準備完了', ko: '<strong>저장</strong> —— Agent가 매니저에 나타나 태스크 준비 완료', fr: '<strong>Sauvegardez</strong> — l’Agent apparaît dans le manager, prêt pour les tâches', de: '<strong>Speichern</strong> — Agent erscheint im Manager, bereit für Aufgaben', es: '<strong>Guarda</strong> — el Agent aparece en el manager, listo para tareas', pt: '<strong>Salve</strong> — o Agent aparece no manager, pronto para tarefas' })"></li>
</ul>

---
layout: split-media
---

# 🧬 {{ $t({ en: 'ClawWork Teams', zh: 'ClawWork Teams', ja: 'ClawWork Teams', ko: 'ClawWork Teams', fr: 'ClawWork Teams', de: 'ClawWork Teams', es: 'ClawWork Teams', pt: 'ClawWork Teams' }) }}

<div class="cw-kicker" v-html="$t({ en: 'A self-contained multi-agent unit. Roles, skills, workflow — packaged together.', zh: '一个自包含的多 Agent 单元。角色、技能、工作流 —— 打包在一起。', ja: '自己完結型のマルチエージェントユニット。ロール、スキル、ワークフローを一括パッケージ。', ko: '자체 완결 멀티 에이전트 단위. 역할, 스킬, 워크플로를 한 번에 패키지화.', fr: 'Une unité multi-agent autonome. Rôles, skills, workflow — empaquetés ensemble.', de: 'Eine eigenständige Multi-Agent-Einheit. Rollen, Skills, Workflow — gemeinsam verpackt.', es: 'Una unidad multi-agente autónoma. Roles, skills, workflow — empaquetados juntos.', pt: 'Uma unidade multi-agente autossuficiente. Papéis, skills, workflow — empacotados juntos.' })"></div>

::left::

<img src="/images/team-details.png" class="cw-shot cw-shot--panel" alt="Team details" />

::right::

<ul class="cw-bullets">
  <li v-html="$t({ en: '<code>TEAM.md</code> — team goals and orchestration workflow', zh: '<code>TEAM.md</code> — 团队目标与编排工作流', ja: '<code>TEAM.md</code> — チーム目標と編排ワークフロー', ko: '<code>TEAM.md</code> — 팀 목표와 오케스트레이션 워크플로', fr: '<code>TEAM.md</code> — objectifs et workflow d’orchestration', de: '<code>TEAM.md</code> — Teamziele und Orchestrierungs-Workflow', es: '<code>TEAM.md</code> — objetivos y flujo de orquestación', pt: '<code>TEAM.md</code> — objetivos e workflow de orquestração' })"></li>
  <li v-html="$t({ en: '<code>AGENT.md</code> — role, skills, and tools per agent', zh: '<code>AGENT.md</code> — 每个 Agent 的角色、技能与工具', ja: '<code>AGENT.md</code> — エージェントごとのロール、スキル、ツール', ko: '<code>AGENT.md</code> — 에이전트별 역할, 스킬, 도구', fr: '<code>AGENT.md</code> — rôle, compétences et outils par agent', de: '<code>AGENT.md</code> — Rolle, Skills und Tools pro Agent', es: '<code>AGENT.md</code> — rol, habilidades y herramientas por agente', pt: '<code>AGENT.md</code> — papel, habilidades e ferramentas por agente' })"></li>
  <li v-html="$t({ en: '<code>SOUL.md</code> — personality and communication style', zh: '<code>SOUL.md</code> — 性格与沟通风格', ja: '<code>SOUL.md</code> — 性格とコミュニケーションスタイル', ko: '<code>SOUL.md</code> — 성격과 커뮤니케이션 스타일', fr: '<code>SOUL.md</code> — personnalité et style de communication', de: '<code>SOUL.md</code> — Persönlichkeit und Kommunikationsstil', es: '<code>SOUL.md</code> — personalidad y estilo de comunicación', pt: '<code>SOUL.md</code> — personalidade e estilo de comunicação' })"></li>
</ul>

<div class="cw-note-panel mt-4" data-tone="green">
  <p class="cw-note-copy" v-html="$t({ en: '<strong>No manual setup.</strong> ClawWork handles agent creation, skill installation, and model assignment for you.', zh: '<strong>无需手动配置。</strong>ClawWork 替你完成 Agent 创建、Skill 安装和模型分配。', ja: '<strong>手動セットアップ不要。</strong>ClawWork がエージェント作成、スキルインストール、モデル割当を処理。', ko: '<strong>수동 설정 불필요.</strong> ClawWork가 에이전트 생성, 스킬 설치, 모델 할당을 처리합니다.', fr: '<strong>Aucune configuration manuelle.</strong> ClawWork gère la création d’agents, l’installation de compétences et l’attribution de modèles.', de: '<strong>Kein manuelles Setup.</strong> ClawWork übernimmt Agent-Erstellung, Skill-Installation und Modellzuweisung.', es: '<strong>Sin configuración manual.</strong> ClawWork gestiona la creación de agentes, instalación de habilidades y asignación de modelos.', pt: '<strong>Sem configuração manual.</strong> ClawWork cuida da criação de agentes, instalação de habilidades e atribuição de modelos.' })"></p>
</div>

---
layout: split-media
---

# 🎯 {{ $t({ en: 'Teams in Action', zh: 'Team 实战', ja: 'チーム実践', ko: '팀 실전', fr: 'Teams en action', de: 'Teams in Aktion', es: 'Teams en acción', pt: 'Teams em ação' }) }}

<div class="cw-kicker">{{ $t({ en: 'From concept to running agents. Every step inside ClawWork.', zh: '从概念到运行。每一步都在 ClawWork 里。', ja: 'コンセプトから実行まで。すべての手順が ClawWork 内で。', ko: '컨셉에서 실행까지. 모든 단계가 ClawWork 안에.', fr: 'Du concept à l’exécution. Chaque étape dans ClawWork.', de: 'Vom Konzept zum laufenden Agent. Jeder Schritt in ClawWork.', es: 'Del concepto a la ejecución. Cada paso dentro de ClawWork.', pt: 'Do conceito à execução. Cada passo dentro do ClawWork.' }) }}</div>

::left::

<img src="/images/team-builder.png" class="cw-shot cw-shot--panel" alt="Team Builder wizard" />

::right::

<DeckMiniPanel tone="purple" :title="{ en: 'AI Team Builder', zh: 'AI Team 构建器', ja: 'AI チームビルダー', ko: 'AI 팀 빌더', fr: 'AI Team Builder', de: 'KI-Team-Builder', es: 'AI Team Builder', pt: 'AI Team Builder' }" :body="{ en: 'Natural language → roles, skills, workflow.', zh: '自然语言 → 角色、技能、工作流。', ja: '自然言語 → ロール・スキル・ワークフロー。', ko: '자연어 → 역할·스킬·워크플로.', fr: 'Langage naturel → rôles, skills, workflow.', de: 'Natürliche Sprache → Rollen, Skills, Workflow.', es: 'Lenguaje natural → roles, skills, workflow.', pt: 'Linguagem natural → papéis, skills, workflow.' }" />

<DeckMiniPanel tone="green" :title="{ en: 'Inline File Tree', zh: '内联文件树', ja: 'インラインファイルツリー', ko: '인라인 파일 트리', fr: 'Arbre de fichiers inline', de: 'Inline-Dateibaum', es: 'Árbol inline', pt: 'Árvore inline' }" :body="{ en: 'Edit TEAM/AGENT/SOUL.md inside the app.', zh: '在产品内直接编辑 TEAM/AGENT/SOUL.md。', ja: 'TEAM/AGENT/SOUL.md をアプリ内で編集。', ko: 'TEAM/AGENT/SOUL.md을 앱 내에서 편집.', fr: 'Éditez TEAM/AGENT/SOUL.md dans l’app.', de: 'TEAM/AGENT/SOUL.md in der App editieren.', es: 'Edita TEAM/AGENT/SOUL.md en la app.', pt: 'Edite TEAM/AGENT/SOUL.md no app.' }" />

<DeckMiniPanel tone="cyan" :title="{ en: 'Team Chat Room', zh: '团队聊天室', ja: 'チームチャットルーム', ko: '팀 채팅방', fr: 'Salon de chat', de: 'Team-Chatraum', es: 'Sala del equipo', pt: 'Sala do time' }" :body="{ en: 'Live avatar bar: who speaks, who executes.', zh: '实时头像栏：谁在说话、谁在执行。', ja: 'ライブアバターバー：発話者と実行者。', ko: '라이브 아바타 바: 발언자·실행자.', fr: 'Barre d’avatars : qui parle, qui exécute.', de: 'Live-Avatar-Leiste: wer spricht, wer ausführt.', es: 'Barra de avatares: quién habla y ejecuta.', pt: 'Barra de avatares: quem fala e executa.' }" />

---
layout: split-media
---

# 🏪 {{ $t({ en: 'TeamsHub', zh: 'TeamsHub', ja: 'TeamsHub', ko: 'TeamsHub', fr: 'TeamsHub', de: 'TeamsHub', es: 'TeamsHub', pt: 'TeamsHub' }) }}

<div class="cw-kicker">{{ $t({ en: 'Git-native team marketplace.', zh: 'Git 原生团队市场。', ja: 'Git ネイティブのチームマーケット。', ko: 'Git 네이티브 팀 마켓플레이스.', fr: 'Marché d’équipes natif Git.', de: 'Git-nativer Team-Marktplatz.', es: 'Mercado de equipos nativo Git.', pt: 'Marketplace de times nativo Git.' }) }}</div>

::left::

<div class="cw-nest" data-tone="cyan">
  <div class="cw-nest-label">🏪 Git → Registry → Install</div>
  <div style="display:flex;flex-direction:column;gap:6px;">
    <div class="cw-nest" data-tone="purple">
      <div class="cw-nest-label">📦 github.com/org/team-pack</div>
    </div>
    <div class="cw-nest" data-tone="cyan">
      <div class="cw-nest-label">🔗 Registry URL</div>
      <div class="cw-nest-items">
        <span class="cw-nest-skill"><span class="cw-nest-dot" data-color="cyan"></span>community</span>
        <span class="cw-nest-skill"><span class="cw-nest-dot" data-color="purple"></span>private</span>
      </div>
    </div>
    <div class="cw-nest" data-tone="green">
      <div class="cw-nest-label">⚡ One-Click Install</div>
    </div>
  </div>
</div>

::right::

<DeckMiniPanel tone="cyan" :title="{ en: 'Git Native', zh: 'Git 原生', ja: 'Git ネイティブ', ko: 'Git 네이티브', fr: 'Natif Git', de: 'Git-nativ', es: 'Nativo Git', pt: 'Git nativo' }" :body="{ en: 'A Team is a Git repo. Share = push to GitHub. Subscribe = add a registry URL.', zh: 'Team 就是一个 Git 仓库。分享 = push 到 GitHub。订阅 = 添加一个 registry URL。', ja: 'Team は Git リポジトリ。共有 = GitHub に push。購読 = registry URL を追加。', ko: 'Team은 Git 저장소. 공유 = GitHub에 push. 구독 = registry URL 추가.', fr: 'Un Team est un repo Git. Partager = push sur GitHub. S’abonner = ajouter un registry.', de: 'Ein Team ist ein Git-Repo. Teilen = auf GitHub pushen. Abonnieren = Registry-URL hinzufügen.', es: 'Un Team es un repo Git. Compartir = push a GitHub. Suscribir = añadir un registry.', pt: 'Um Team é um repo Git. Compartilhar = push no GitHub. Assinar = adicionar um registry.' }" />

<DeckMiniPanel tone="green" :title="{ en: 'One-Click Install', zh: '一键安装', ja: 'ワンクリックインストール', ko: '원클릭 설치', fr: 'Installation en un clic', de: 'Ein-Klick-Installation', es: 'Instalación en un clic', pt: 'Instalação em um clique' }" :body="{ en: 'Install orchestrator handles agent creation, skill installation, and model binding automatically.', zh: '安装编排器自动处理 Agent 创建、Skill 安装和模型绑定。', ja: 'インストールオーケストレーターが Agent 作成、Skill インストール、モデルバインドを自動処理。', ko: '설치 오케스트레이터가 Agent 생성, Skill 설치, 모델 바인딩을 자동 처리.', fr: 'L’orchestrateur gère création d’agents, installation de skills et liaison de modèle automatiquement.', de: 'Der Installations-Orchestrator übernimmt Agent-Erstellung, Skill-Installation und Modell-Bindung automatisch.', es: 'El orquestador gestiona creación de agentes, instalación de skills y vinculación de modelo automáticamente.', pt: 'O orquestrador gerencia criação de agentes, instalação de skills e vinculação de modelo automaticamente.' }" />

<DeckMiniPanel tone="purple" :title="{ en: 'Multi-Source Registries', zh: '多源 Registry', ja: 'マルチソース Registry', ko: '멀티 소스 레지스트리', fr: 'Registres multi-sources', de: 'Multi-Source-Registries', es: 'Registries multi-fuente', pt: 'Registries multi-fonte' }" :body="{ en: 'Community, private, team. Add as many registries as you want — all Git-based.', zh: '社区、私有、团队。想加多少 registry 就加多少 —— 全部基于 Git。', ja: 'コミュニティ、プライベート、チーム。好きなだけ registry を追加 —— すべて Git ベース。', ko: '커뮤니티, 프라이빗, 팀. 원하는 만큼 registry 추가 — 모두 Git 기반.', fr: 'Communauté, privé, équipe. Ajoutez autant de registres que voulu — tous Git.', de: 'Community, privat, Team. So viele Registries wie du willst — alle Git-basiert.', es: 'Comunidad, privado, equipo. Añade tantos registries como quieras — todos en Git.', pt: 'Comunidade, privado, time. Adicione quantos registries quiser — todos em Git.' }" />

---
layout: split-media
---

# 🎭 {{ $t({ en: 'Multi-Session Orchestration', zh: '多 Session 编排', ja: 'マルチセッション編排', ko: '멀티 세션 오케스트레이션', fr: 'Orchestration multi-session', de: 'Multi-Session-Orchestrierung', es: 'Orquestación multisesión', pt: 'Orquestração multissessão' }) }}

<div class="cw-kicker">{{ $t({ en: 'One Conductor. N Performers. Pure session primitives.', zh: '一个 Conductor，N 个 Performer。纯 session 原语编排。', ja: '1 Conductor、N Performer。純粋なセッションプリミティブ。', ko: '1 Conductor, N Performer. 순수 세션 프리미티브.', fr: 'Un Conductor. N Performers. Primitives de session pures.', de: 'Ein Conductor. N Performer. Reine Session-Primitive.', es: 'Un Conductor. N Performers. Primitivas de sesión puras.', pt: 'Um Conductor. N Performers. Primitivas de sessão puras.' }) }}</div>

::left::

<img src="/images/agents-list.png" class="cw-shot cw-shot--panel" alt="TaskRoom multi-agent orchestration" />

::right::

<DeckMiniPanel tone="purple" :title="{ en: 'Ensemble Task', zh: 'Ensemble Task', ja: 'Ensemble Task', ko: 'Ensemble Task', fr: 'Ensemble Task', de: 'Ensemble Task', es: 'Ensemble Task', pt: 'Ensemble Task' }" :body="{ en: '1 Conductor + N Performers. Extends 1 Task = 1 Session to multi-agent.', zh: '1 Conductor + N Performer。把 1 Task = 1 Session 扩展为多 Agent 协作。', ja: '1 Conductor + N Performer。1 Task = 1 Session をマルチエージェントに拡張。', ko: '1 Conductor + N Performer. 1 Task = 1 Session을 멀티 에이전트로 확장.', fr: '1 Conductor + N Performers. Étend 1 Task = 1 Session au multi-agent.', de: '1 Conductor + N Performer. Erweitert 1 Task = 1 Session zu Multi-Agent.', es: '1 Conductor + N Performers. Extiende 1 Task = 1 Session a multi-agente.', pt: '1 Conductor + N Performers. Estende 1 Task = 1 Session para multi-agente.' }" />

<DeckMiniPanel tone="green" :title="{ en: 'Serial & Parallel', zh: '串行与并行', ja: 'シリアル＆パラレル', ko: '직렬 & 병렬', fr: 'Série & parallèle', de: 'Seriell & Parallel', es: 'Serie & paralelo', pt: 'Série & paralelo' }" :body="{ en: 'timeout:30 for serial handoff. timeout:0 for parallel fan-out. No external workers.', zh: 'timeout:30 串行交接，timeout:0 并行扇出。无外部 worker。', ja: 'timeout:30 で直列ハンドオフ。timeout:0 で並列ファンアウト。外部ワーカーなし。', ko: 'timeout:30 직렬 핸드오프. timeout:0 병렬 팬아웃. 외부 워커 없음.', fr: 'timeout:30 pour le relais série. timeout:0 pour le fan-out parallèle. Pas de workers externes.', de: 'timeout:30 für serielle Übergabe. timeout:0 für parallelen Fan-out. Keine externen Worker.', es: 'timeout:30 para relevo serial. timeout:0 para fan-out paralelo. Sin workers externos.', pt: 'timeout:30 para handoff serial. timeout:0 para fan-out paralelo. Sem workers externos.' }" />

<DeckMiniPanel tone="cyan" :title="{ en: 'Isolated by Design', zh: '隔离即设计', ja: '設計による分離', ko: '설계에 의한 격리', fr: 'Isolé par conception', de: 'Isolation by Design', es: 'Aislado por diseño', pt: 'Isolado por design' }" :body="{ en: 'Write isolated by sessionKey. Read aggregated by taskId. @All summons all; live avatar bar shows who is active.', zh: '写入按 sessionKey 隔离，展示按 taskId 聚合。@All 召集全员，实时头像栏显示谁在活动。', ja: 'sessionKey で書込分離、taskId で読取集約。@All で全員召集、ライブアバターバーで活動者を表示。', ko: 'sessionKey로 쓰기 격리, taskId로 읽기 집계. @All로 전원 소환, 라이브 아바타 바로 활동자 표시.', fr: 'Écriture isolée par sessionKey, lecture agrégée par taskId. @All convoque tous ; barre d’avatars en direct.', de: 'Schreiben isoliert nach sessionKey, Lesen aggregiert nach taskId. @All ruft alle, Live-Avatar-Leiste zeigt Aktivität.', es: 'Escritura aislada por sessionKey, lectura agregada por taskId. @All convoca a todos; barra de avatares en vivo.', pt: 'Escrita isolada por sessionKey, leitura agregada por taskId. @All convoca todos; barra de avatares ao vivo.' }" />

---
layout: split-media
---

# 📱 {{ $t({ en: 'ClawWork in Your Pocket', zh: 'ClawWork 装进口袋', ja: 'ClawWork をポケットに', ko: '주머니 속의 ClawWork', fr: 'ClawWork dans votre poche', de: 'ClawWork in der Tasche', es: 'ClawWork en tu bolsillo', pt: 'ClawWork no bolso' }) }}

<div class="cw-kicker">{{ $t({ en: 'Not remote control. A real mobile app.', zh: '不是远程控制，是真正的移动端 App。', ja: 'リモートコントロールではない。本物のモバイル App。', ko: '원격 제어가 아닌, 진짜 모바일 앱.', fr: 'Pas un contrôle à distance. Une vraie app mobile.', de: 'Keine Fernsteuerung. Eine echte Mobile-App.', es: 'No es control remoto. Una app móvil real.', pt: 'Não é controle remoto. Um app mobile de verdade.' }) }}</div>

::left::

<div style="display: flex; justify-content: center; align-items: center; height: 100%;">
  <img src="/images/pwa.png" class="cw-shot cw-shot--hero" alt="ClawWork PWA mobile" />
</div>

::right::

<DeckMiniPanel tone="cyan" :title="{ en: 'Installable', zh: '可安装', ja: 'インストール可能', ko: '설치 가능', fr: 'Installable', de: 'Installierbar', es: 'Instalable', pt: 'Instalável' }" :body="{ en: 'Standalone mode. No browser UI. OLED dark.', zh: 'Standalone 模式，无浏览器 UI，OLED 深色。', ja: 'スタンドアロン。ブラウザ UI なし。OLED ダーク。', ko: '독립 모드. 브라우저 UI 없음. OLED 다크.', fr: 'Mode standalone. Sans UI navigateur. Sombre OLED.', de: 'Standalone. Keine Browser-UI. OLED-Dunkel.', es: 'Standalone. Sin UI de navegador. OLED oscuro.', pt: 'Standalone. Sem UI de browser. OLED escuro.' }" />

<DeckMiniPanel tone="green" :title="{ en: 'Offline First', zh: '离线优先', ja: 'オフライン優先', ko: '오프라인 우선', fr: 'Hors-ligne d’abord', de: 'Offline-First', es: 'Offline primero', pt: 'Offline primeiro' }" :body="{ en: 'Service Worker + IndexedDB. Browse history underground.', zh: 'Service Worker + IndexedDB。地铁里也能看历史。', ja: 'Service Worker + IndexedDB。地下鉄でも履歴閲覧。', ko: 'Service Worker + IndexedDB. 지하철에서도 이력 열람.', fr: 'Service Worker + IndexedDB. Historique dans le métro.', de: 'Service Worker + IndexedDB. Verlauf in der U-Bahn.', es: 'Service Worker + IndexedDB. Historial en el metro.', pt: 'Service Worker + IndexedDB. Histórico no metrô.' }" />

<DeckMiniPanel tone="red" :title="{ en: 'Independent Identity', zh: '独立身份', ja: '独立 ID', ko: '독립 신원', fr: 'Identité indépendante', de: 'Unabhängige Identität', es: 'Identidad independiente', pt: 'Identidade independente' }" :body="{ en: 'Ed25519 via WebCrypto. Private key never leaves the device.', zh: 'WebCrypto 生成 Ed25519。私钥永远不出设备。', ja: 'WebCrypto で Ed25519 生成。秘密鍵はデバイス外へ出ない。', ko: 'WebCrypto로 Ed25519 생성. 개인 키는 기기 밖으로 안 나감.', fr: 'Ed25519 via WebCrypto. Clé privée jamais hors appareil.', de: 'Ed25519 per WebCrypto. Private Key bleibt auf dem Gerät.', es: 'Ed25519 vía WebCrypto. Privada nunca sale del dispositivo.', pt: 'Ed25519 via WebCrypto. Privada nunca sai do dispositivo.' }" />

---

<div class="cw-grid"></div>
<div class="glow-orb glow-purple cw-pulse" style="top:-80px; right:25%;"></div>
<div class="glow-orb glow-cyan cw-pulse" style="bottom:-60px; left:30%;"></div>

<div class="cw-thanks-shell">
  <h1 class="cw-display-title">
    <span class="cw-shimmer">{{ $t({ en: 'One More Thing...', zh: 'One More Thing...', ja: 'One More Thing...', ko: 'One More Thing...', fr: 'One More Thing...', de: 'One More Thing...', es: 'One More Thing...', pt: 'One More Thing...' }) }}</span>
  </h1>
  <p class="cw-thanks-copy">{{ $t({ en: 'No window. Just start.', zh: '无需窗口，直接开始。', ja: 'ウィンドウ不要。すぐ開始。', ko: '창 없이 바로 시작.', fr: 'Pas de fenêtre. Démarrez.', de: 'Kein Fenster. Einfach starten.', es: 'Sin ventana. Empieza.', pt: 'Sem janela. Comece.' }) }}</p>
</div>

---
layout: split-media
---

# ⌨️ {{ $t({ en: 'Quick Launch', zh: '快捷启动器', ja: 'クイックランチ', ko: '퀵 런치', fr: 'Quick Launch', de: 'Quick Launch', es: 'Quick Launch', pt: 'Quick Launch' }) }}

<div class="cw-kicker">{{ $t({ en: 'Alt+Space. Type. Done. Never open the main window.', zh: 'Alt+Space 呼出，输入，完成。无需打开主窗口。', ja: 'Alt+Space で呼出、入力、完了。メインウィンドウ不要。', ko: 'Alt+Space 호출, 입력, 완료. 메인 창 불필요.', fr: 'Alt+Espace. Tapez. Fait. Jamais ouvrir la fenêtre principale.', de: 'Alt+Leertaste. Tippen. Fertig. Nie das Hauptfenster öffnen.', es: 'Alt+Espacio. Escribe. Listo. Nunca abres la ventana principal.', pt: 'Alt+Espaço. Digite. Pronto. Nunca abre a janela principal.' }) }}</div>

::left::

<div class="cw-nest" data-tone="purple" style="padding: 18px;">
  <div class="cw-nest-label" style="font-size: 13px; margin-bottom: 14px; opacity: 0.8;">⌨️ Alt + Space · 680 × 72</div>
  <div style="background: rgba(0,0,0,0.55); border-radius: 10px; padding: 16px 18px; display: flex; align-items: center; gap: 14px; border: 1px solid rgba(139, 92, 246, 0.45); box-shadow: 0 8px 32px rgba(139, 92, 246, 0.15);">
    <span style="color: rgba(139, 92, 246, 0.9); font-size: 20px;">⌨</span>
    <span style="color: rgba(255,255,255,0.55); font-family: monospace; font-size: 14px;">What's on your mind?</span>
  </div>
  <div class="cw-nest-items" style="margin-top: 14px; justify-content: flex-end;">
    <span class="cw-nest-skill"><span class="cw-nest-dot" data-color="green"></span>Enter to start</span>
    <span class="cw-nest-skill"><span class="cw-nest-dot" data-color="yellow"></span>Esc to dismiss</span>
  </div>
</div>

::right::

<ul class="cw-bullets">
  <li v-html="$t({ en: '<strong>Global shortcut</strong>: <code>Alt+Space</code> by default, fully configurable', zh: '<strong>全局快捷键</strong>：默认 <code>Alt+Space</code>，完全可配置', ja: '<strong>グローバルショートカット</strong>：デフォルト <code>Alt+Space</code>、設定可能', ko: '<strong>전역 단축키</strong>: 기본값 <code>Alt+Space</code>, 완전 설정 가능', fr: '<strong>Raccourci global</strong> : <code>Alt+Space</code> par défaut, configurable', de: '<strong>Globaler Shortcut</strong>: Standard <code>Alt+Space</code>, konfigurierbar', es: '<strong>Atajo global</strong>: <code>Alt+Space</code> por defecto, configurable', pt: '<strong>Atalho global</strong>: <code>Alt+Space</code> por padrão, configurável' })"></li>
  <li v-html="$t({ en: '<strong>Spotlight-style overlay</strong>: 680 × 72, frameless, transparent, always on top', zh: '<strong>Spotlight 风格浮窗</strong>：680 × 72，无边框、透明、始终置顶', ja: '<strong>Spotlight 風オーバーレイ</strong>：680 × 72、フレームレス、透明、常時最前面', ko: '<strong>Spotlight 스타일 오버레이</strong>: 680 × 72, 프레임리스, 투명, 항상 위', fr: '<strong>Superposition style Spotlight</strong> : 680 × 72, sans cadre, transparente, toujours au-dessus', de: '<strong>Spotlight-artige Überlagerung</strong>: 680 × 72, rahmenlos, transparent, immer oben', es: '<strong>Overlay tipo Spotlight</strong>: 680 × 72, sin marco, transparente, siempre encima', pt: '<strong>Overlay estilo Spotlight</strong>: 680 × 72, sem moldura, transparente, sempre no topo' })"></li>
  <li v-html="$t({ en: '<strong>Cross-workspace</strong>: visible on every virtual desktop, even in fullscreen apps', zh: '<strong>跨虚拟桌面</strong>：在所有虚拟桌面可见，包括全屏应用', ja: '<strong>仮想デスクトップ横断</strong>：すべての仮想デスクトップで可視、フルスクリーンアプリでも', ko: '<strong>가상 데스크톱 통합</strong>: 모든 가상 데스크톱에서 보임, 풀스크린 앱 포함', fr: '<strong>Inter-bureau</strong> : visible sur tous les bureaux virtuels, même en plein écran', de: '<strong>Workspace-übergreifend</strong>: auf jedem virtuellen Desktop sichtbar, auch im Vollbild', es: '<strong>Entre escritorios</strong>: visible en todos los escritorios virtuales, incluso en pantalla completa', pt: '<strong>Entre workspaces</strong>: visível em todos os desktops virtuais, mesmo em tela cheia' })"></li>
  <li v-html="$t({ en: '<strong>Blur to dismiss</strong>: loses focus → hides automatically, no clutter', zh: '<strong>失焦即隐藏</strong>：丢失焦点自动隐藏，不留痕迹', ja: '<strong>フォーカスを失うと非表示</strong>：自動的に隠れ、混雑しない', ko: '<strong>포커스 잃으면 숨김</strong>: 자동으로 숨고, 방해 없음', fr: '<strong>Disparaît au blur</strong> : perd le focus → se cache, zéro encombrement', de: '<strong>Bei Fokusverlust</strong>: automatisch ausblenden, kein Müll', es: '<strong>Se oculta al perder foco</strong>: automático, sin desorden', pt: '<strong>Oculta ao perder foco</strong>: automático, sem bagunça' })"></li>
</ul>

<div class="cw-note-panel mt-4" data-tone="purple">
  <p class="cw-note-copy" v-html="$t({ en: '<strong>The minimum distance between idea and task.</strong>', zh: '<strong>想法与任务之间的最短距离。</strong>', ja: '<strong>アイデアとタスクの最短距離。</strong>', ko: '<strong>아이디어와 태스크 사이의 최단 거리.</strong>', fr: '<strong>La distance minimale entre une idée et une tâche.</strong>', de: '<strong>Der kürzeste Weg von der Idee zur Aufgabe.</strong>', es: '<strong>La distancia mínima entre una idea y una tarea.</strong>', pt: '<strong>A menor distância entre uma ideia e uma tarefa.</strong>' })"></p>
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
