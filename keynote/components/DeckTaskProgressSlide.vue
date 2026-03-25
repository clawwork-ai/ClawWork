<template>
  <div class="cw-split cw-split--media cw-mt-12">
    <div class="cw-progress-card">
      <div class="cw-progress-header">
        <span class="en cw-progress-title">Build Progress</span>
        <span class="zh cw-progress-title">构建进度</span>
        <span class="cw-progress-value">5/7</span>
      </div>
      <div class="cw-progress-track">
        <div class="cw-progress-fill" style="--cw-progress: 71%"></div>
      </div>
      <div class="cw-progress-list">
        <div class="cw-progress-item cw-progress-item--done">
          <span>✓</span><span class="en">Initialize project structure</span><span class="zh">初始化项目结构</span>
        </div>
        <div class="cw-progress-item cw-progress-item--done">
          <span>✓</span><span class="en">Set up argument parser</span><span class="zh">设置参数解析器</span>
        </div>
        <div class="cw-progress-item cw-progress-item--done">
          <span>✓</span><span class="en">Implement core rename logic</span><span class="zh">实现核心重命名逻辑</span>
        </div>
        <div class="cw-progress-item cw-progress-item--done">
          <span>✓</span><span class="en">Add dry-run mode</span><span class="zh">添加试运行模式</span>
        </div>
        <div class="cw-progress-item cw-progress-item--done">
          <span>✓</span><span class="en">Write unit tests</span><span class="zh">编写单元测试</span>
        </div>
        <div class="cw-progress-item cw-progress-item--active">
          <span>◉</span><span class="en">Error handling &amp; logging</span><span class="zh">错误处理与日志</span
          ><span class="en cw-progress-badge">In Progress</span><span class="zh cw-progress-badge">进行中</span>
        </div>
        <div class="cw-progress-item cw-progress-item--pending">
          <span>○</span><span class="en">Write README</span><span class="zh">编写 README</span>
        </div>
      </div>
    </div>

    <div class="cw-stack-md">
      <div class="cw-note-panel" data-tone="green">
        <h3 class="en cw-note-title">How It Works</h3>
        <h3 class="zh cw-note-title">工作原理</h3>
        <ul class="en cw-bullets">
          <li>Agent <code>[x]</code> / <code>[ ]</code> responses auto-parsed</li>
          <li>Visual progress steps and real-time counter</li>
          <li>No manual tracking needed</li>
        </ul>
        <ul class="zh cw-bullets">
          <li>Agent <code>[x]</code> / <code>[ ]</code> 响应自动解析</li>
          <li>可视化进度步骤与实时计数</li>
          <li>无需手动追踪</li>
        </ul>
      </div>

      <div class="cw-note-panel cw-note-panel--neutral" data-tone="cyan">
        <h3 class="en cw-note-title">The Result</h3>
        <h3 class="zh cw-note-title">最终效果</h3>
        <p class="en cw-note-copy">
          Agent conversation becomes a <strong>trackable work item</strong>. Output becomes your progress view.
        </p>
        <p class="zh cw-note-copy">Agent 对话会变成<strong>可追踪的工作项</strong>。产出即你的进度视图。</p>
      </div>
    </div>
  </div>
</template>
