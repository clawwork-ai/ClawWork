import type { Translations } from './en';

export const zh: Translations = {
  nav: {
    features: '功能',
    architecture: '架构',
    quickStart: '快速开始',
    docs: '文档',
    pwa: 'PWA',
    github: 'GitHub',
  },
  hero: {
    headline: '开源 OpenClaw 桌面客户端',
    tagline: '并行运行多个 AI 任务，实时观察每次工具调用，所有输出自动本地保存。',
    downloadFor: '下载',
    allDownloads: '全部下载',
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
    backToHome: '返回首页',
    pairingGateway: {
      title: '与 OpenClaw 网关配对',
      intro: 'ClawWork 通过 Gateway 服务器连接 OpenClaw。本指南将引导你添加网关并完成设备认证。',
      prereqTitle: '前置条件',
      prereqItems: [
        '一个正在运行且可访问的 OpenClaw Gateway 实例',
        '已安装 ClawWork 桌面应用，或在浏览器中打开了 PWA',
        '网关 URL（本地默认：ws://127.0.0.1:18789）',
      ],
      addGatewayTitle: '添加网关',
      addGatewaySteps: [
        '打开 ClawWork，进入设置（侧栏齿轮图标）',
        '滚动到网关（Gateways）区域',
        '点击「添加网关」',
        '输入名称（如「本地网关」）和 WebSocket URL',
        '选择认证方式：Token、密码或配对码',
      ],
      tokenTitle: '认证方式：Token',
      tokenDesc: '使用预共享的 API Token。适合自动化部署或管理员已分配 Token 的场景。',
      tokenSteps: [
        '在网关表单中选择「Token」标签页',
        '粘贴管理员提供的 API Token',
        '点击「测试连接」验证',
        '保存网关配置',
      ],
      passwordTitle: '认证方式：密码',
      passwordDesc: '使用网关上配置的密码进行认证。',
      passwordSteps: ['在网关表单中选择「密码」标签页', '输入网关密码', '点击「测试连接」验证', '保存网关配置'],
      pairingTitle: '认证方式：配对码',
      pairingDesc:
        '配对码是首次设备配对的推荐方式。网关会生成一个 setup code（Base64 字符串），你可以粘贴或扫描二维码。',
      pairingSteps: [
        '在网关表单中选择「配对码」标签页',
        '从网关管理员或网关 Web UI 获取 setup code',
        '粘贴 setup code——ClawWork 会自动提取 URL 和配对 Token',
        '点击「开始配对」发起设备配对请求',
        '等待网关管理员批准你的设备',
        '批准后，ClawWork 会收到设备 Token 并自动连接',
      ],
      pairingNote:
        '配对码是一次性的。设备获批后，ClawWork 会在本地保存设备 Token 用于后续连接。如果你重置了设备身份，需要重新配对。',
      verifyTitle: '验证连接',
      verifySteps: [
        '保存后，网关应在设置中显示绿色「已连接」状态',
        '返回主界面——创建新任务时应能看到该网关的 Agent 列表',
        '如果连接失败，检查网关 URL 是否可达以及认证信息是否正确',
      ],
    },
    pairingPwa: {
      title: '使用 ClawWork PWA',
      intro: 'ClawWork PWA 是基于浏览器的版本，可在任何设备上运行——桌面、平板或手机。无需安装。',
      whatIsPwaTitle: '什么是 ClawWork PWA？',
      whatIsPwaContent:
        'ClawWork PWA（渐进式 Web 应用）与桌面应用共享相同的核心逻辑——Store、Service 和网关协议。它完全在浏览器中运行，通过 WebSocket 连接 OpenClaw 网关。数据存储在 IndexedDB 中（而非 SQLite），设备密钥由浏览器存储管理。',
      installTitle: '打开与安装',
      installSteps: [
        '在任意现代浏览器（Chrome、Safari、Edge、Firefox）中打开 cpwa.pages.dev',
        '应用会立即加载——无需安装',
        '移动端安装：点击浏览器的「添加到主屏幕」选项',
        '桌面端安装：点击浏览器地址栏中的安装图标',
        '安装后，ClawWork PWA 可像原生应用一样启动，并支持离线访问',
      ],
      connectTitle: '连接网关',
      connectSteps: [
        '打开应用，进入设置页面',
        '使用与桌面应用相同的方式添加网关（Token、密码或配对码）',
        '输入网关 WebSocket URL——必须从你的浏览器网络可达',
        '本地网关（ws://127.0.0.1:18789）需要在同一台机器上使用',
        '远程网关请使用完整 URL（如 wss://gateway.example.com:18789）',
      ],
      pairingTitle: 'PWA 中的配对码',
      pairingDesc: 'PWA 支持与桌面应用相同的配对码流程，唯一区别是：需要手动粘贴 setup code，无法扫描二维码。',
      pairingSteps: [
        '从网关管理员处获取 setup code',
        '粘贴到配对码输入框——URL 和 Token 会自动提取',
        '开始配对流程，等待管理员批准',
        '批准后，设备 Token 保存在浏览器的 IndexedDB 中',
      ],
      tipsTitle: '使用提示',
      tips: [
        'PWA 支持离线浏览缓存数据，但与网关通信需要网络连接',
        '浏览器存储（IndexedDB）绑定到域名——清除浏览器数据会重置网关配置和设备身份',
        '为获得最佳移动体验，建议将 PWA 安装到主屏幕，以全屏模式运行',
        'PWA 和桌面应用可以同时连接同一个网关——各自拥有独立的设备身份',
      ],
    },
  },
  footer: {
    product: {
      title: '产品',
      links: [
        { label: '功能', href: '#features' },
        { label: '快速开始', href: '#quick-start' },
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
        { label: '配对指南', href: 'docs/pairing-gateway' },
        { label: 'PWA 指南', href: 'docs/pairing-pwa' },
        { label: '更新日志', href: 'https://github.com/clawwork-ai/clawwork/releases' },
        { label: '许可证', href: 'https://github.com/clawwork-ai/clawwork/blob/main/LICENSE' },
      ],
    },
    copyright: '© 2026 ClawWork 贡献者。Apache 2.0 协议。',
  },
};
