<template>
  <div class="cw-stack-md">
    <div class="cw-stack-md">
      <DeckMiniPanel
        tone="green"
        en-title="Session Key"
        zh-title="会话标识"
        en-body="<code>agent:&lt;id&gt;:clawwork:task:&lt;taskId&gt;</code>"
        zh-body="<code>agent:&lt;id&gt;:clawwork:task:&lt;taskId&gt;</code>"
      />
      <DeckMiniPanel
        tone="cyan"
        en-title="Isolation"
        zh-title="隔离"
        en-body="Events routed by sessionKey. No cross-talk between tasks."
        zh-body="事件按 sessionKey 路由。任务间互不干扰。"
      />
      <DeckMiniPanel
        tone="purple"
        en-title="Desktop RPC"
        zh-title="桌面端 RPC"
        en-body="Dedicated <code>exec.approval.resolve</code>. Not chat messages."
        zh-body="专用 <code>exec.approval.resolve</code>。不是聊天消息。"
      />
    </div>
  </div>
</template>
