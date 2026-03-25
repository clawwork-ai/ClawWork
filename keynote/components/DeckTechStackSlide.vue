<template>
  <div class="cw-split cw-split--media cw-mt-16">
    <div class="cw-stack-md">
      <h3 class="en cw-panel-title cw-tone-green">Stack Matrix</h3>
      <h3 class="zh cw-panel-title cw-tone-green">技术栈清单</h3>

      <div class="cw-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Layer</th>
              <th>Choice</th>
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

    <div class="cw-stack-md">
      <h3 class="en cw-panel-title">Design Choices</h3>
      <h3 class="zh cw-panel-title">设计理念</h3>

      <ul class="en cw-bullets">
        <li>Dark-first theme with a bright green accent language</li>
        <li>All colors defined through CSS variables</li>
        <li>Standard Gateway protocol with no fork and no custom API</li>
        <li>Single-writer message model to prevent duplication bugs</li>
      </ul>

      <ul class="zh cw-bullets">
        <li>暗色优先主题，辅以高亮绿色视觉语言</li>
        <li>所有颜色通过 CSS 变量定义</li>
        <li>标准 Gateway 协议，无 fork，无自定义 API</li>
        <li>单写者消息模型，防止重复消息问题</li>
      </ul>

      <div class="cw-note-panel cw-note-panel--neutral" data-tone="green">
        <p class="en cw-note-copy">
          Every technology choice prioritizes <strong>ecosystem compatibility</strong>. Zero server-side changes
          required.
        </p>
        <p class="zh cw-note-copy">每项技术选型都优先考虑<strong>生态兼容性</strong>。零服务端改动。</p>
      </div>
    </div>
  </div>
</template>
