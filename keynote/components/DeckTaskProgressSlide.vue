<script setup lang="ts">
import { t } from '../composables/i18n';
</script>

<template>
  <div class="cw-split--media mt-3">
    <div class="cw-progress-card">
      <div class="cw-progress-header">
        <span class="cw-progress-title">{{
          t({
            en: 'Build Progress',
            zh: '构建进度',
            ja: 'ビルド進捗',
            ko: '빌드 진행',
            fr: 'Progression du build',
            de: 'Build-Fortschritt',
            es: 'Progreso del build',
            pt: 'Progresso do build',
          })
        }}</span>
        <span class="cw-progress-value">5/7</span>
      </div>
      <div class="cw-progress-track">
        <div class="cw-progress-fill" style="--cw-progress: 71%"></div>
      </div>
      <div class="cw-progress-list">
        <div class="cw-progress-item cw-progress-item--done">
          <span>✓</span
          ><span>{{
            t({
              en: 'Initialize project structure',
              zh: '初始化项目结构',
              ja: 'プロジェクト構造の初期化',
              ko: '프로젝트 구조 초기화',
              fr: 'Initialiser la structure du projet',
              de: 'Projektstruktur initialisieren',
              es: 'Inicializar estructura del proyecto',
              pt: 'Inicializar estrutura do projeto',
            })
          }}</span>
        </div>
        <div class="cw-progress-item cw-progress-item--done">
          <span>✓</span
          ><span>{{
            t({
              en: 'Set up argument parser',
              zh: '设置参数解析器',
              ja: '引数パーサーの設定',
              ko: '인자 파서 설정',
              fr: 'Configurer le parseur d’arguments',
              de: 'Argument-Parser einrichten',
              es: 'Configurar parser de argumentos',
              pt: 'Configurar parser de argumentos',
            })
          }}</span>
        </div>
        <div class="cw-progress-item cw-progress-item--done">
          <span>✓</span
          ><span>{{
            t({
              en: 'Implement core rename logic',
              zh: '实现核心重命名逻辑',
              ja: 'コアリネームロジックの実装',
              ko: '핵심 리네임 로직 구현',
              fr: 'Implémenter la logique de renommage',
              de: 'Kern-Rename-Logik implementieren',
              es: 'Implementar lógica de renombrado',
              pt: 'Implementar lógica de renomeação',
            })
          }}</span>
        </div>
        <div class="cw-progress-item cw-progress-item--done">
          <span>✓</span
          ><span>{{
            t({
              en: 'Add dry-run mode',
              zh: '添加试运行模式',
              ja: 'ドライランモードの追加',
              ko: '드라이런 모드 추가',
              fr: 'Ajouter le mode dry-run',
              de: 'Dry-Run-Modus hinzufügen',
              es: 'Añadir modo dry-run',
              pt: 'Adicionar modo dry-run',
            })
          }}</span>
        </div>
        <div class="cw-progress-item cw-progress-item--done">
          <span>✓</span
          ><span>{{
            t({
              en: 'Write unit tests',
              zh: '编写单元测试',
              ja: 'ユニットテストの作成',
              ko: '유닛 테스트 작성',
              fr: 'Écrire les tests unitaires',
              de: 'Unit-Tests schreiben',
              es: 'Escribir tests unitarios',
              pt: 'Escrever testes unitários',
            })
          }}</span>
        </div>
        <div class="cw-progress-item cw-progress-item--active">
          <span>◉</span
          ><span>{{
            t({
              en: 'Error handling & logging',
              zh: '错误处理与日志',
              ja: 'エラーハンドリングとログ',
              ko: '에러 처리 및 로깅',
              fr: 'Gestion d’erreurs et logging',
              de: 'Fehlerbehandlung & Logging',
              es: 'Manejo de errores y logging',
              pt: 'Tratamento de erros e logging',
            })
          }}</span
          ><span class="cw-progress-badge">{{
            t({
              en: 'In Progress',
              zh: '进行中',
              ja: '進行中',
              ko: '진행 중',
              fr: 'En cours',
              de: 'In Arbeit',
              es: 'En progreso',
              pt: 'Em andamento',
            })
          }}</span>
        </div>
        <div class="cw-progress-item cw-progress-item--pending">
          <span>○</span
          ><span>{{
            t({
              en: 'Write README',
              zh: '编写 README',
              ja: 'README の作成',
              ko: 'README 작성',
              fr: 'Écrire le README',
              de: 'README schreiben',
              es: 'Escribir README',
              pt: 'Escrever README',
            })
          }}</span>
        </div>
      </div>
    </div>

    <div class="flex flex-col gap-3">
      <div class="cw-note-panel" data-tone="green">
        <h3 class="cw-note-title">
          {{
            t({
              en: 'How It Works',
              zh: '工作原理',
              ja: '仕組み',
              ko: '작동 원리',
              fr: 'Comment ça marche',
              de: 'So funktioniert es',
              es: 'Cómo funciona',
              pt: 'Como funciona',
            })
          }}
        </h3>
        <ul class="cw-bullets">
          <li>
            {{
              t({
                en: 'Agent [x] / [ ] responses auto-parsed',
                zh: 'Agent [x] / [ ] 响应自动解析',
                ja: 'Agent [x] / [ ] レスポンスを自動パース',
                ko: 'Agent [x] / [ ] 응답 자동 파싱',
                fr: 'Réponses Agent [x] / [ ] auto-parsées',
                de: 'Agent [x] / [ ] Antworten automatisch geparst',
                es: 'Respuestas Agent [x] / [ ] auto-parseadas',
                pt: 'Respostas Agent [x] / [ ] auto-parseadas',
              })
            }}
          </li>
          <li>
            {{
              t({
                en: 'Visual progress steps and real-time counter',
                zh: '可视化进度步骤与实时计数',
                ja: '視覚的な進捗ステップとリアルタイムカウンター',
                ko: '시각적 진행 단계와 실시간 카운터',
                fr: 'Étapes visuelles et compteur en temps réel',
                de: 'Visuelle Fortschrittsschritte und Echtzeit-Zähler',
                es: 'Pasos visuales y contador en tiempo real',
                pt: 'Etapas visuais e contador em tempo real',
              })
            }}
          </li>
          <li>
            {{
              t({
                en: 'No manual tracking needed',
                zh: '无需手动追踪',
                ja: '手動トラッキング不要',
                ko: '수동 추적 불필요',
                fr: 'Aucun suivi manuel nécessaire',
                de: 'Kein manuelles Tracking nötig',
                es: 'Sin seguimiento manual',
                pt: 'Sem rastreamento manual',
              })
            }}
          </li>
        </ul>
      </div>

      <div class="cw-note-panel cw-note-panel--neutral" data-tone="cyan">
        <h3 class="cw-note-title">
          {{
            t({
              en: 'The Result',
              zh: '最终效果',
              ja: '結果',
              ko: '결과',
              fr: 'Le résultat',
              de: 'Das Ergebnis',
              es: 'El resultado',
              pt: 'O resultado',
            })
          }}
        </h3>
        <p
          class="cw-note-copy"
          v-html="
            t({
              en: 'Agent conversation becomes a <strong>trackable work item</strong>. Output becomes your progress view.',
              zh: 'Agent 对话会变成<strong>可追踪的工作项</strong>。产出即你的进度视图。',
              ja: 'Agent の会話が<strong>追跡可能な作業項目</strong>に。出力があなたの進捗ビューになる。',
              ko: 'Agent 대화가 <strong>추적 가능한 작업 항목</strong>으로. 출력이 진행 상황 뷰가 됩니다.',
              fr: 'La conversation Agent devient un <strong>élément de travail traçable</strong>. La sortie devient votre vue de progression.',
              de: 'Agent-Gespräch wird zum <strong>nachverfolgbaren Arbeitsposten</strong>. Die Ausgabe wird zur Fortschrittsansicht.',
              es: 'La conversación con Agent se convierte en un <strong>elemento de trabajo rastreable</strong>. La salida se convierte en tu vista de progreso.',
              pt: 'A conversa com o Agent se torna um <strong>item de trabalho rastreável</strong>. A saída se torna sua visão de progresso.',
            })
          "
        ></p>
      </div>
    </div>
  </div>
</template>
