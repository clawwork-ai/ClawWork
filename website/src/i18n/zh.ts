import type { Translations } from './en';

export const zh: Translations = {
  nav: {
    features: '功能',
    quickStart: '快速开始',
    github: 'GitHub',
  },
  hero: {
    headline: '开源 OpenClaw 桌面客户端',
    tagline: '并行运行多个 AI 任务，实时观察每次工具调用，所有输出自动本地保存。',
    badgeMacOS: 'macOS',
    badgeWindows: 'Windows',
    badgeLinux: 'Linux（即将推出）',
  },
  install: {
    title: '安装',
    orDownload: '或从',
    githubReleases: 'GitHub Releases',
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
  footer: {
    product: {
      title: '产品',
      links: [
        { label: '功能', href: '#features' },
        { label: '快速开始', href: '#quick-start' },
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
        { label: '文档', href: 'https://github.com/clawwork-ai/clawwork/blob/main/README.md' },
        { label: '更新日志', href: 'https://github.com/clawwork-ai/clawwork/releases' },
        { label: '许可证', href: 'https://github.com/clawwork-ai/clawwork/blob/main/LICENSE' },
      ],
    },
    copyright: '© 2025 ClawWork 贡献者。Apache 2.0 协议。',
  },
};
