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
            ja: 'OpenClaw のタスクワークベンチ',
            ko: 'OpenClaw 태스크 워크벤치',
            fr: "L'atelier de tâches pour OpenClaw",
            de: 'Die Aufgaben-Werkbank für OpenClaw',
            es: 'El banco de tareas para OpenClaw',
            pt: 'A bancada de tarefas para OpenClaw',
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
            ja: '更新日 2026-03-27',
            ko: '업데이트 2026-03-27',
            fr: 'Mis à jour le 2026-03-27',
            de: 'Aktualisiert am 2026-03-27',
            es: 'Actualizado el 2026-03-27',
            pt: 'Atualizado em 2026-03-27',
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
            ja: 'より良いチャットウィンドウではない。<strong>並列タスクワークベンチ</strong>。',
            ko: '더 나은 채팅 창이 아닙니다. <strong>병렬 태스크 워크벤치</strong>.',
            fr: 'Pas une meilleure fenêtre de chat. Un <strong>atelier de tâches parallèles</strong>.',
            de: 'Kein besseres Chat-Fenster. Eine <strong>parallele Aufgaben-Werkbank</strong>.',
            es: 'No es una mejor ventana de chat. Un <strong>banco de tareas paralelas</strong>.',
            pt: 'Não é uma janela de chat melhor. Uma <strong>bancada de tarefas paralelas</strong>.',
          })
        "
      ></p>
    </div>
  </div>
</template>
