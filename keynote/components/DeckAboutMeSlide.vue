<script setup lang="ts">
import { t } from '../composables/i18n';
</script>

<template>
  <div class="cw-profile">
    <div class="cw-profile-aside">
      <img src="https://github.com/samzong.png" class="cw-profile-avatar" alt="Samzong" />
      <div class="cw-profile-name">Samzong</div>
      <div class="cw-profile-role">
        {{
          t({
            en: '(Captain)',
            zh: '(船长)',
            ja: '(キャプテン)',
            ko: '(캡틴)',
            fr: '(Capitaine)',
            de: '(Kapitän)',
            es: '(Capitán)',
            pt: '(Capitão)',
          })
        }}
      </div>
      <a href="https://github.com/samzong" target="_blank" class="cw-profile-handle">github.com/samzong</a>
      <div
        class="cw-profile-expertise"
        v-html="
          t({
            en: 'Inference scheduling<br />Multi-model routing<br />Production LLMOps<br />Cloud-native AI',
            zh: '推理调度<br />多模型路由<br />生产级 LLMOps<br />云原生 AI',
            ja: '推論スケジューリング<br />マルチモデルルーティング<br />本番 LLMOps<br />クラウドネイティブ AI',
            ko: '추론 스케줄링<br />멀티모델 라우팅<br />프로덕션 LLMOps<br />클라우드 네이티브 AI',
            fr: 'Planification d’inférence<br />Routage multi-modèle<br />LLMOps en production<br />IA cloud-native',
            de: 'Inferenz-Scheduling<br />Multi-Model-Routing<br />Produktions-LLMOps<br />Cloud-native AI',
            es: 'Programación de inferencia<br />Enrutamiento multi-modelo<br />LLMOps en producción<br />IA cloud-native',
            pt: 'Agendamento de inferência<br />Roteamento multi-modelo<br />LLMOps em produção<br />IA cloud-native',
          })
        "
      ></div>
    </div>

    <div class="cw-profile-main">
      <div class="cw-profile-highlight">
        <img src="/images/clawwork-logo.png" class="cw-logo-sm" alt="ClawWork" />
        <div class="flex-1">
          <div class="cw-profile-highlight-title">
            <span>{{
              t({
                en: 'Author of ClawWork',
                zh: 'ClawWork 作者',
                ja: 'ClawWork 作者',
                ko: 'ClawWork 개발자',
                fr: 'Auteur de ClawWork',
                de: 'Autor von ClawWork',
                es: 'Autor de ClawWork',
                pt: 'Autor do ClawWork',
              })
            }}</span>
            <span class="text-[13px] op-50"><GhStars repo="clawwork-ai/ClawWork" /></span>
          </div>
          <div class="cw-profile-highlight-copy">
            {{
              t({
                en: 'Open Source OpenClaw Desktop Client. Parallel tasks, structured artifacts, scheduled automation.',
                zh: '开源 OpenClaw 桌面客户端。并行任务、结构化产物、定时自动化。',
                ja: 'オープンソース OpenClaw デスクトップクライアント。並列タスク、構造化アーティファクト、スケジュール自動化。',
                ko: '오픈소스 OpenClaw 데스크톱 클라이언트. 병렬 태스크, 구조화된 아티팩트, 예약 자동화.',
                fr: 'Client de bureau OpenClaw open source. Tâches parallèles, artefacts structurés, automatisation planifiée.',
                de: 'Open-Source-OpenClaw-Desktop-Client. Parallele Aufgaben, strukturierte Artefakte, geplante Automatisierung.',
                es: 'Cliente de escritorio OpenClaw de código abierto. Tareas paralelas, artefactos estructurados, automatización programada.',
                pt: 'Cliente desktop OpenClaw de código aberto. Tarefas paralelas, artefatos estruturados, automação agendada.',
              })
            }}
          </div>
        </div>
      </div>

      <div class="cw-profile-panels">
        <div class="cw-project-list">
          <div class="cw-panel-title cw-tone-cyan">
            {{
              t({
                en: 'Open Source',
                zh: '开源贡献',
                ja: 'オープンソース',
                ko: '오픈소스',
                fr: 'Open Source',
                de: 'Open Source',
                es: 'Código abierto',
                pt: 'Código aberto',
              })
            }}
          </div>
          <DeckRepoRow
            image="https://github.com/vllm-project.png"
            badge="Committer"
            badge-tone="green"
            label="semantic-router"
            meta="⭐ 3.5k"
          />
          <DeckRepoRow
            image="https://github.com/llm-d.png"
            badge="Contrib"
            badge-tone="cyan"
            label="llm-d"
            meta="⭐ 2.7k"
          />
          <DeckRepoRow
            image="https://github.com/Project-HAMi.png"
            badge="Contrib"
            badge-tone="cyan"
            label="HAMi · Kueue"
            meta="⭐ 3.1k · 2.4k"
          />
          <DeckRepoRow
            image="https://github.com/istio.png"
            badge="Contrib"
            badge-tone="cyan"
            label="Istio · Karmada · K8s"
            meta="⭐ 38k+"
          />
        </div>

        <div class="cw-project-list">
          <div class="cw-panel-title cw-tone-purple">
            {{
              t({
                en: 'Side Projects',
                zh: '个人项目',
                ja: '個人プロジェクト',
                ko: '사이드 프로젝트',
                fr: 'Projets perso',
                de: 'Nebenprojekte',
                es: 'Proyectos paralelos',
                pt: 'Projetos paralelos',
              })
            }}
          </div>
          <DeckRepoRow
            image="https://raw.githubusercontent.com/samzong/chrome-tabboost/main/src/assets/icons/icon128.png"
            label="Chrome TabBoost"
            meta="⭐ 81"
          />
          <DeckRepoRow
            image="https://raw.githubusercontent.com/samzong/MacMusicPlayer/main/MacMusicPlayer/Assets.xcassets/AppIcon.appiconset/icon_256x256_2x.png"
            label="MacMusicPlayer"
            meta="⭐ 75"
          />
          <DeckRepoRow
            image="https://raw.githubusercontent.com/samzong/ConfigForge/main/ConfigForge/Assets.xcassets/Logo.imageset/logo.png"
            label="ConfigForge"
            meta="⭐ 41"
          />
          <DeckRepoRow image="https://raw.githubusercontent.com/samzong/gmc/main/logo.png" label="gmc" meta="⭐ 10" />
          <DeckRepoRow
            image="https://raw.githubusercontent.com/samzong/hf-model-downloader/main/assets/icon.png"
            label="hf-model-downloader"
            meta="⭐ 23"
          />
          <div class="cw-project-cloud">
            <img
              src="https://raw.githubusercontent.com/samzong/mdctl/main/mdctl.png"
              class="cw-project-icon"
              alt="mdctl"
              title="mdctl"
            />
            <img
              src="https://raw.githubusercontent.com/samzong/ai-icon-generator/main/public/logo.png"
              class="cw-project-icon"
              alt="ai-icon-generator"
              title="ai-icon-generator"
            />
            <img
              src="https://raw.githubusercontent.com/samzong/SaveEye/main/SaveEye/Resources/Assets.xcassets/Logo.imageset/logo.png"
              class="cw-project-icon"
              alt="SaveEye"
              title="SaveEye"
            />
            <img
              src="https://raw.githubusercontent.com/samzong/LogoWallpaper/main/LogoWallpaper/Assets.xcassets/AppIcon.appiconset/logo-256.png"
              class="cw-project-icon"
              alt="LogoWallpaper"
              title="LogoWallpaper"
            />
            <span class="cw-project-cloud-note">+5 more</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
