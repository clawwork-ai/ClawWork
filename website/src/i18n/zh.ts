import type { Translations } from './en';

export const zh: Translations = {
  nav: {
    features: '功能',
    architecture: '架构',
    blogs: '博客',
    keynote: 'Keynote',
    pwa: 'PWA',
    github: 'GitHub',
  },
  hero: {
    headline: '开源 OpenClaw 桌面客户端',
    tagline: '并行运行多个 AI 任务，实时观察每次工具调用，所有输出自动本地保存。',
    downloadFor: '下载',
    download: {
      macOS: 'macOS (Apple Silicon)',
      macOSIntel: 'macOS (Intel)',
      windows: 'Windows',
      linux: 'Linux',
    },
  },
  install: {
    title: '通过 Homebrew 安装',
    orDownload: '或从',
    githubReleases: 'GitHub Releases',
  },
  architecture: {
    title: '工作原理',
    subtitle: '通过单一 WebSocket 连接一个或多个 OpenClaw 网关。每个任务拥有独立会话。所有数据本地存储。',
  },
  features: {
    title: '为什么选择 ClawWork',
    items: [
      {
        title: '并行多任务',
        description: '每个任务在独立的 OpenClaw 会话中运行。在并行任务间切换，上下文互不干扰。',
      },
      {
        title: '三栏布局',
        description: '任务列表、带内联工具卡的对话区、上下文面板并排显示。',
      },
      {
        title: '本地优先产物',
        description: 'AI 输出自动保存到专属工作区——按任务分类、SQLite FTS 全文索引、数据完全属于你。',
      },
      {
        title: '全文检索',
        description: '专属文件浏览器，基于 FTS5 跨任务、消息和文件全文搜索。',
      },
      {
        title: '工具调用透明',
        description: '带实时状态的内联工具卡。高风险命令弹出确认对话框。',
      },
      {
        title: '多网关与模型',
        description: '连接多个 OpenClaw 网关。每个任务独立切换模型和思考级别。',
      },
      {
        title: '定时任务',
        description: '使用 cron、every 或 at 表达式定时运行任务。查看执行历史，随时手动触发。',
      },
      {
        title: 'Agent 与工具管理',
        description: '直接创建、编辑和管理 Agent。浏览每个网关的完整工具目录。',
      },
      {
        title: 'PWA 与移动端',
        description: '在任何浏览器中访问 ClawWork——桌面或移动端。可安装到主屏幕，支持离线使用。',
      },
    ],
  },
  quickStart: {
    title: '快速开始',
    steps: [
      {
        title: '安装 ClawWork',
        code: 'brew tap clawwork-ai/clawwork\nbrew install --cask clawwork',
      },
      {
        title: '启动 OpenClaw 网关',
        code: 'openclaw gateway start',
      },
      {
        title: '在设置中添加网关',
        code: 'ws://127.0.0.1:18789',
      },
      {
        title: '创建任务，开始工作',
        code: null,
      },
    ],
  },
  docs: {
    title: '博客',
    backToList: '所有文章',
    noTranslation: '本文暂无当前语言版本，显示原始语言内容。',
  },
  footer: {
    product: {
      title: '产品',
      links: [
        { label: '功能', href: '#features' },
        { label: 'PWA', href: 'https://cpwa.pages.dev' },
        { label: 'Keynote', href: 'keynote/' },
      ],
    },
    community: {
      title: '社区',
      links: [
        { label: 'GitHub', href: 'https://github.com/clawwork-ai/clawwork' },
        { label: 'Issues', href: 'https://github.com/clawwork-ai/clawwork/issues' },
        { label: '讨论区', href: 'https://github.com/clawwork-ai/clawwork/discussions' },
      ],
    },
    resources: {
      title: '资源',
      links: [
        { label: '博客', href: 'blogs' },
        { label: '更新日志', href: 'https://github.com/clawwork-ai/clawwork/releases' },
        { label: '许可证', href: 'https://github.com/clawwork-ai/clawwork/blob/main/LICENSE' },
      ],
    },
    copyright: '© 2026 ClawWork 贡献者。Apache 2.0 协议。',
  },
};
