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
            })
          }}</span>
        </div>
        <div class="cw-progress-item cw-progress-item--done">
          <span>✓</span
          ><span>{{
            t({
              en: 'Set up argument parser',
              zh: '设置参数解析器',
            })
          }}</span>
        </div>
        <div class="cw-progress-item cw-progress-item--done">
          <span>✓</span
          ><span>{{
            t({
              en: 'Implement core rename logic',
              zh: '实现核心重命名逻辑',
            })
          }}</span>
        </div>
        <div class="cw-progress-item cw-progress-item--done">
          <span>✓</span
          ><span>{{
            t({
              en: 'Add dry-run mode',
              zh: '添加试运行模式',
            })
          }}</span>
        </div>
        <div class="cw-progress-item cw-progress-item--done">
          <span>✓</span
          ><span>{{
            t({
              en: 'Write unit tests',
              zh: '编写单元测试',
            })
          }}</span>
        </div>
        <div class="cw-progress-item cw-progress-item--active">
          <span>◉</span
          ><span>{{
            t({
              en: 'Error handling & logging',
              zh: '错误处理与日志',
            })
          }}</span
          ><span class="cw-progress-badge">{{
            t({
              en: 'In Progress',
              zh: '进行中',
            })
          }}</span>
        </div>
        <div class="cw-progress-item cw-progress-item--pending">
          <span>○</span
          ><span>{{
            t({
              en: 'Write README',
              zh: '编写 README',
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
            })
          }}
        </h3>
        <ul class="cw-bullets">
          <li>
            {{
              t({
                en: 'Agent [x] / [ ] responses auto-parsed',
                zh: 'Agent [x] / [ ] 响应自动解析',
              })
            }}
          </li>
          <li>
            {{
              t({
                en: 'Visual progress steps and real-time counter',
                zh: '可视化进度步骤与实时计数',
              })
            }}
          </li>
          <li>
            {{
              t({
                en: 'No manual tracking needed',
                zh: '无需手动追踪',
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
            })
          }}
        </h3>
        <p
          class="cw-note-copy"
          v-html="
            t({
              en: 'Agent conversation becomes a <strong>trackable work item</strong>. Output becomes your progress view.',
              zh: 'Agent 对话会变成<strong>可追踪的工作项</strong>。产出即你的进度视图。',
            })
          "
        ></p>
      </div>
    </div>
  </div>
</template>
