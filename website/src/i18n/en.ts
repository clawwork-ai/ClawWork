export interface Translations {
  nav: {
    features: string;
    architecture: string;
    quickStart: string;
    github: string;
  };
  hero: {
    headline: string;
    tagline: string;
    badgeMacOS: string;
    badgeWindows: string;
    badgeLinux: string;
  };
  install: {
    title: string;
    orDownload: string;
    githubReleases: string;
  };
  architecture: {
    title: string;
    subtitle: string;
  };
  features: {
    title: string;
    items: Array<{ title: string; description: string }>;
  };
  quickStart: {
    title: string;
    steps: Array<{ title: string; code: string | null }>;
  };
  footer: {
    product: { title: string; links: Array<{ label: string; href: string }> };
    community: { title: string; links: Array<{ label: string; href: string }> };
    resources: { title: string; links: Array<{ label: string; href: string }> };
    copyright: string;
  };
}

export const en: Translations = {
  nav: {
    features: 'Features',
    architecture: 'Architecture',
    quickStart: 'Quick Start',
    github: 'GitHub',
  },
  hero: {
    headline: 'Open Source OpenClaw Client',
    tagline: 'Run parallel AI tasks. Watch every tool call. Every output saved locally.',
    badgeMacOS: 'macOS',
    badgeWindows: 'Windows',
    badgeLinux: 'Linux (coming soon)',
  },
  install: {
    title: 'Install',
    orDownload: 'Or download from',
    githubReleases: 'GitHub Releases',
  },
  architecture: {
    title: 'How It Works',
    subtitle:
      'A single WebSocket connects to one or more OpenClaw Gateways. Each task gets its own session. Everything is stored locally.',
  },
  features: {
    title: 'Why ClawWork',
    items: [
      {
        title: 'Parallel Multi-Task',
        description: 'Each task runs in its own OpenClaw session. Switch between parallel jobs without mixing context.',
      },
      {
        title: 'Three-Panel Layout',
        description: 'Tasks, conversation with inline tool cards, and context panel side by side.',
      },
      {
        title: 'Local-First Artifacts',
        description:
          'Every AI output persisted to a dedicated workspace — organized by task, indexed by SQLite FTS, and yours to keep.',
      },
      {
        title: 'Full-Text Search',
        description: 'Dedicated file browser. FTS5 search across tasks, messages, and files.',
      },
      {
        title: 'Tool Call Transparency',
        description: 'Inline tool cards with live status. Approval dialogs for risky commands.',
      },
      {
        title: 'Multi-Gateway & Model',
        description: 'Connect multiple OpenClaw Gateways. Switch models and thinking levels per task.',
      },
    ],
  },
  quickStart: {
    title: 'Quick Start',
    steps: [
      {
        title: 'Install ClawWork',
        code: 'brew tap clawwork-ai/clawwork\nbrew install --cask clawwork',
      },
      {
        title: 'Start an OpenClaw Gateway',
        code: 'openclaw gateway start',
      },
      {
        title: 'Add gateway in Settings',
        code: 'ws://127.0.0.1:18789',
      },
      {
        title: 'Create a task and start working',
        code: null,
      },
    ],
  },
  footer: {
    product: {
      title: 'Product',
      links: [
        { label: 'Features', href: '#features' },
        { label: 'Quick Start', href: '#quick-start' },
      ],
    },
    community: {
      title: 'Community',
      links: [
        { label: 'GitHub', href: 'https://github.com/clawwork-ai/clawwork' },
        { label: 'Issues', href: 'https://github.com/clawwork-ai/clawwork/issues' },
        { label: 'Discussions', href: 'https://github.com/clawwork-ai/clawwork/discussions' },
      ],
    },
    resources: {
      title: 'Resources',
      links: [
        {
          label: 'Documentation',
          href: 'https://github.com/clawwork-ai/clawwork/blob/main/README.md',
        },
        { label: 'Changelog', href: 'https://github.com/clawwork-ai/clawwork/releases' },
        {
          label: 'License',
          href: 'https://github.com/clawwork-ai/clawwork/blob/main/LICENSE',
        },
      ],
    },
    copyright: '© 2026 ClawWork Contributors. Apache 2.0 License.',
  },
};
