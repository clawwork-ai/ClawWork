<script setup lang="ts">
import { t } from '../composables/i18n';
</script>

<template>
  <div class="cw-grid"></div>
  <div class="glow-orb glow-green cw-pulse" style="top: -120px; right: 20%"></div>
  <div class="glow-orb glow-purple cw-pulse" style="bottom: -100px; left: -60px"></div>
  <div class="glow-orb glow-cyan cw-pulse" style="top: 50%; right: -80px"></div>
  <div class="cw-scanline"></div>

  <div class="cw-split--hero">
    <div class="cw-hero-copy">
      <div class="cw-brand-row">
        <img src="/images/clawwork-logo.png" class="cw-logo-lg cw-float cw-logo-glow" alt="ClawWork" />
        <span class="cw-brand-divider">×</span>
        <img src="/images/openclaw-logo.png" class="cw-logo-openclaw cw-float-slow" alt="OpenClaw" />
      </div>

      <h1 class="cw-hero-title">
        <span class="cw-shimmer">ClawWork</span>
      </h1>

      <p class="cw-subtitle">
        {{
          t({
            en: 'The Task Workbench for OpenClaw',
            zh: 'OpenClaw 的任务工作台',
          })
        }}
      </p>

      <a href="https://github.com/clawwork-ai/ClawWork" target="_blank" class="cw-inline-repo">
        <GhIcon />
        clawwork-ai/ClawWork
      </a>

      <div class="cw-meta-row">
        <span>samzong</span>
        <span>·</span>
        <span>{{
          t({
            en: 'Updated 2026-03-27',
            zh: '更新于 2026-03-27',
          })
        }}</span>
      </div>
    </div>

    <div class="cw-shot-stage">
      <div class="cw-screenshot-glow"></div>
      <img src="/images/clawwork-screenshot.png" class="cw-shot cw-shot--hero cw-float" alt="ClawWork App" />
      <p
        class="cw-shot-caption"
        v-html="
          t({
            en: 'Not a better chat window. A <strong>parallel task workbench</strong>.',
            zh: '不是更好的聊天窗口，而是<strong>并行任务工作台</strong>。',
          })
        "
      ></p>
    </div>
  </div>
</template>
