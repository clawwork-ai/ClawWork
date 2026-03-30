export interface Translations {
  nav: {
    features: string;
    architecture: string;
    quickStart: string;
    docs: string;
    pwa: string;
    github: string;
  };
  hero: {
    headline: string;
    tagline: string;
    downloadFor: string;
    allDownloads: string;
    download: {
      macOS: string;
      macOSIntel: string;
      windows: string;
      linux: string;
    };
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
  docs: {
    backToHome: string;
    pairingGateway: {
      title: string;
      intro: string;
      prereqTitle: string;
      prereqItems: string[];
      addGatewayTitle: string;
      addGatewaySteps: string[];
      tokenTitle: string;
      tokenDesc: string;
      tokenSteps: string[];
      passwordTitle: string;
      passwordDesc: string;
      passwordSteps: string[];
      pairingTitle: string;
      pairingDesc: string;
      pairingSteps: string[];
      pairingNote: string;
      verifyTitle: string;
      verifySteps: string[];
    };
    pairingPwa: {
      title: string;
      intro: string;
      whatIsPwaTitle: string;
      whatIsPwaContent: string;
      installTitle: string;
      installSteps: string[];
      connectTitle: string;
      connectSteps: string[];
      pairingTitle: string;
      pairingDesc: string;
      pairingSteps: string[];
      tipsTitle: string;
      tips: string[];
    };
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
    docs: 'Docs',
    pwa: 'PWA',
    github: 'GitHub',
  },
  hero: {
    headline: 'Open Source OpenClaw Client',
    tagline: 'Run parallel AI tasks. Watch every tool call. Every output saved locally.',
    downloadFor: 'Download for',
    allDownloads: 'All downloads',
    download: {
      macOS: 'macOS (Apple Silicon)',
      macOSIntel: 'macOS (Intel)',
      windows: 'Windows',
      linux: 'Linux',
    },
  },
  install: {
    title: 'Install via Homebrew',
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
      {
        title: 'Scheduled Tasks',
        description:
          'Run tasks on a schedule with cron, every, or at expressions. Check run history, trigger manually anytime.',
      },
      {
        title: 'Agent & Tools Management',
        description: 'Create, edit, and manage agents directly. Browse the full tools catalog for each gateway.',
      },
      {
        title: 'PWA & Mobile',
        description:
          'Access ClawWork from any browser — desktop or mobile. Installable to your home screen, works offline.',
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
  docs: {
    backToHome: 'Back to home',
    pairingGateway: {
      title: 'Pairing with an OpenClaw Gateway',
      intro:
        'ClawWork connects to OpenClaw through a Gateway server. This guide walks you through adding a gateway and authenticating your device.',
      prereqTitle: 'Prerequisites',
      prereqItems: [
        'An OpenClaw Gateway instance running and accessible on your network',
        'ClawWork desktop app installed, or the PWA open in a browser',
        'The gateway URL (default for local: ws://127.0.0.1:18789)',
      ],
      addGatewayTitle: 'Adding a Gateway',
      addGatewaySteps: [
        'Open ClawWork and go to Settings (gear icon in the sidebar)',
        'Scroll to the Gateways section',
        'Click "Add Gateway"',
        'Enter a name (e.g. "Local Gateway") and the WebSocket URL',
        'Choose an authentication method: Token, Password, or Pairing Code',
      ],
      tokenTitle: 'Auth: Token',
      tokenDesc: 'Use a pre-shared API token. Best for automated setups or when an admin has given you a token.',
      tokenSteps: [
        'Select the "Token" tab in the gateway form',
        'Paste the API token provided by your gateway admin',
        'Click "Test Connection" to verify',
        'Save the gateway configuration',
      ],
      passwordTitle: 'Auth: Password',
      passwordDesc: 'Authenticate with a password configured on the gateway.',
      passwordSteps: [
        'Select the "Password" tab in the gateway form',
        'Enter the gateway password',
        'Click "Test Connection" to verify',
        'Save the gateway configuration',
      ],
      pairingTitle: 'Auth: Pairing Code',
      pairingDesc:
        'The pairing code flow is the recommended way for first-time device setup. The gateway generates a setup code (a Base64 string) that you can paste or scan as a QR code.',
      pairingSteps: [
        'Select the "Pairing Code" tab in the gateway form',
        "Get the setup code from your gateway admin or the gateway's web UI",
        'Paste the setup code — ClawWork will auto-extract the URL and pairing token',
        'Click "Start Pairing" to initiate the device pairing request',
        'Wait for the gateway admin to approve your device',
        'Once approved, ClawWork receives a device token and connects automatically',
      ],
      pairingNote:
        'The pairing code is one-time use. After your device is approved, ClawWork stores a device token locally and uses it for future connections. If you reset your device identity, you will need to pair again.',
      verifyTitle: 'Verifying the Connection',
      verifySteps: [
        'After saving, the gateway should show a green "Connected" status in Settings',
        "Go back to the main view — you should see the gateway's agents available when creating a new task",
        'If the connection fails, check that the gateway URL is reachable and the credentials are correct',
      ],
    },
    pairingPwa: {
      title: 'Using ClawWork PWA',
      intro:
        'ClawWork PWA is a browser-based version of ClawWork that works on any device — desktop, tablet, or phone. No install required.',
      whatIsPwaTitle: 'What is ClawWork PWA?',
      whatIsPwaContent:
        'ClawWork PWA (Progressive Web App) shares the same core logic as the desktop app — stores, services, and gateway protocol. It runs entirely in the browser and connects to OpenClaw gateways over WebSocket. Data is stored in IndexedDB instead of SQLite, and device keys are managed in browser storage.',
      installTitle: 'Opening & Installing',
      installSteps: [
        'Open cpwa.pages.dev in any modern browser (Chrome, Safari, Edge, Firefox)',
        'The app loads immediately — no install required',
        'To install on mobile: tap the browser\'s "Add to Home Screen" option',
        'To install on desktop: click the install icon in the browser address bar',
        'Once installed, ClawWork PWA launches like a native app with offline support',
      ],
      connectTitle: 'Connecting to a Gateway',
      connectSteps: [
        'Open the app and navigate to Settings',
        'Add a gateway using the same flow as the desktop app (Token, Password, or Pairing Code)',
        "Enter the gateway WebSocket URL — it must be reachable from your browser's network",
        'For local gateways (ws://127.0.0.1:18789), you need to be on the same machine',
        'For remote gateways, use the full URL (e.g. wss://gateway.example.com:18789)',
      ],
      pairingTitle: 'Pairing Code on PWA',
      pairingDesc:
        'The PWA supports the same pairing code flow as the desktop app, with one difference: you paste the setup code manually instead of scanning a QR code.',
      pairingSteps: [
        'Get the setup code from your gateway admin',
        'Paste it into the Pairing Code field — the URL and token are extracted automatically',
        'Start the pairing process and wait for admin approval',
        "Once approved, the device token is stored in your browser's IndexedDB",
      ],
      tipsTitle: 'Tips',
      tips: [
        'The PWA works offline for browsing cached data, but needs a network connection to communicate with gateways',
        'Browser storage (IndexedDB) is scoped to the domain — clearing browser data will reset your gateway configs and device identity',
        'For the best mobile experience, install the PWA to your home screen so it runs in full-screen mode',
        'The PWA and desktop app can connect to the same gateway simultaneously — each gets its own device identity',
      ],
    },
  },
  footer: {
    product: {
      title: 'Product',
      links: [
        { label: 'Features', href: '#features' },
        { label: 'Quick Start', href: '#quick-start' },
        { label: 'PWA', href: 'https://cpwa.pages.dev' },
        { label: 'Keynote', href: 'keynote/' },
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
        { label: 'Pairing Guide', href: 'docs/pairing-gateway' },
        { label: 'PWA Guide', href: 'docs/pairing-pwa' },
        { label: 'Changelog', href: 'https://github.com/clawwork-ai/clawwork/releases' },
        { label: 'License', href: 'https://github.com/clawwork-ai/clawwork/blob/main/LICENSE' },
      ],
    },
    copyright: '© 2026 ClawWork Contributors. Apache 2.0 License.',
  },
};
