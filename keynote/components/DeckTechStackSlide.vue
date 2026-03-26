<script setup lang="ts">
import { t } from '../composables/i18n';
</script>

<template>
  <div class="cw-split--media mt-4">
    <div class="flex flex-col gap-3">
      <h3 class="cw-panel-title cw-tone-green">
        {{
          t({
            en: 'Stack Matrix',
            zh: '技术栈清单',
            ja: '技術スタック一覧',
            ko: '기술 스택',
            fr: 'Stack technique',
            de: 'Tech-Stack-Übersicht',
            es: 'Stack técnico',
            pt: 'Stack técnico',
          })
        }}
      </h3>

      <div class="cw-table-wrap">
        <table>
          <thead>
            <tr>
              <th>
                <span>{{
                  t({
                    en: 'Layer',
                    zh: '层级',
                    ja: 'レイヤー',
                    ko: '레이어',
                    fr: 'Couche',
                    de: 'Schicht',
                    es: 'Capa',
                    pt: 'Camada',
                  })
                }}</span>
              </th>
              <th>
                <span>{{
                  t({
                    en: 'Choice',
                    zh: '选型',
                    ja: '選定',
                    ko: '선택',
                    fr: 'Choix',
                    de: 'Auswahl',
                    es: 'Elección',
                    pt: 'Escolha',
                  })
                }}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Shell</td>
              <td>Electron 34 + electron-vite</td>
            </tr>
            <tr>
              <td>UI</td>
              <td>React 19 + TypeScript + Tailwind v4</td>
            </tr>
            <tr>
              <td>Components</td>
              <td>shadcn/ui (Radix + cva)</td>
            </tr>
            <tr>
              <td>Animation</td>
              <td>Framer Motion</td>
            </tr>
            <tr>
              <td>State</td>
              <td>Zustand 5</td>
            </tr>
            <tr>
              <td>Database</td>
              <td>better-sqlite3 + Drizzle ORM</td>
            </tr>
            <tr>
              <td>Gateway</td>
              <td>Standard OpenClaw WS Protocol</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="flex flex-col gap-3">
      <h3 class="cw-panel-title">
        {{
          t({
            en: 'Design Choices',
            zh: '设计理念',
            ja: '設計方針',
            ko: '설계 원칙',
            fr: 'Choix de design',
            de: 'Design-Entscheidungen',
            es: 'Decisiones de diseño',
            pt: 'Decisões de design',
          })
        }}
      </h3>

      <ul class="cw-bullets">
        <li>
          {{
            t({
              en: 'Dark-first theme with a bright green accent language',
              zh: '暗色优先主题，辅以高亮绿色视觉语言',
              ja: 'ダークファーストテーマとグリーンのアクセントカラー',
              ko: '다크 우선 테마와 밝은 초록 액센트',
              fr: 'Thème dark-first avec accent vert vif',
              de: 'Dark-first-Theme mit leuchtendem Grün-Akzent',
              es: 'Tema oscuro primero con acento verde brillante',
              pt: 'Tema dark-first com acento verde vibrante',
            })
          }}
        </li>
        <li>
          {{
            t({
              en: 'All colors defined through CSS variables',
              zh: '所有颜色通过 CSS 变量定义',
              ja: 'すべての色を CSS 変数で定義',
              ko: '모든 색상을 CSS 변수로 정의',
              fr: 'Toutes les couleurs via variables CSS',
              de: 'Alle Farben über CSS-Variablen',
              es: 'Todos los colores mediante variables CSS',
              pt: 'Todas as cores via variáveis CSS',
            })
          }}
        </li>
        <li>
          {{
            t({
              en: 'Standard Gateway protocol with no fork and no custom API',
              zh: '标准 Gateway 协议，无 fork，无自定义 API',
              ja: '標準 Gateway プロトコル、fork なし、カスタム API なし',
              ko: '표준 Gateway 프로토콜, fork 없이, 커스텀 API 없이',
              fr: 'Protocole Gateway standard, pas de fork, pas d’API custom',
              de: 'Standard-Gateway-Protokoll, kein Fork, keine Custom-API',
              es: 'Protocolo Gateway estándar, sin fork, sin API personalizada',
              pt: 'Protocolo Gateway padrão, sem fork, sem API customizada',
            })
          }}
        </li>
        <li>
          {{
            t({
              en: 'Single-writer message model to prevent duplication bugs',
              zh: '单写者消息模型，防止重复消息问题',
              ja: 'メッセージ重複バグを防ぐ単一ライターモデル',
              ko: '메시지 중복 버그 방지를 위한 단일 라이터 모델',
              fr: 'Modèle d’écriture unique pour prévenir les doublons',
              de: 'Single-Writer-Nachrichtenmodell gegen Duplikate',
              es: 'Modelo de escritor único para prevenir duplicados',
              pt: 'Modelo de escritor único para prevenir duplicação',
            })
          }}
        </li>
      </ul>

      <div class="cw-note-panel cw-note-panel--neutral" data-tone="green">
        <p
          class="cw-note-copy"
          v-html="
            t({
              en: 'Every technology choice prioritizes <strong>ecosystem compatibility</strong>. Zero server-side changes required.',
              zh: '每项技术选型都优先考虑<strong>生态兼容性</strong>。零服务端改动。',
              ja: 'すべての技術選定で<strong>エコシステム互換性</strong>を優先。サーバー側の変更はゼロ。',
              ko: '모든 기술 선택에서 <strong>생태계 호환성</strong>을 우선. 서버 측 변경 불필요.',
              fr: 'Chaque choix technique privilégie la <strong>compatibilité écosystème</strong>. Zéro modification côté serveur.',
              de: 'Jede Technologieentscheidung priorisiert <strong>Ökosystem-Kompatibilität</strong>. Keine serverseitigen Änderungen.',
              es: 'Cada elección técnica prioriza la <strong>compatibilidad del ecosistema</strong>. Cero cambios en el servidor.',
              pt: 'Cada escolha técnica prioriza <strong>compatibilidade do ecossistema</strong>. Zero alterações no servidor.',
            })
          "
        ></p>
      </div>
    </div>
  </div>
</template>
