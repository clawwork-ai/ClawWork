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
                  })
                }}</span>
              </th>
              <th>
                <span>{{
                  t({
                    en: 'Choice',
                    zh: '选型',
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
          })
        }}
      </h3>

      <ul class="cw-bullets">
        <li>
          {{
            t({
              en: 'Dark-first theme with a bright green accent language',
              zh: '暗色优先主题，辅以高亮绿色视觉语言',
            })
          }}
        </li>
        <li>
          {{
            t({
              en: 'All colors defined through CSS variables',
              zh: '所有颜色通过 CSS 变量定义',
            })
          }}
        </li>
        <li>
          {{
            t({
              en: 'Standard Gateway protocol with no fork and no custom API',
              zh: '标准 Gateway 协议，无 fork，无自定义 API',
            })
          }}
        </li>
        <li>
          {{
            t({
              en: 'Single-writer message model to prevent duplication bugs',
              zh: '单写者消息模型，防止重复消息问题',
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
            })
          "
        ></p>
      </div>
    </div>
  </div>
</template>
