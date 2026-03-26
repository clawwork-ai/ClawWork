export interface NotificationSettings {
  taskComplete?: boolean;
  approvalRequest?: boolean;
  gatewayDisconnect?: boolean;
}

export interface AppSettings {
  workspacePath: string;
  theme?: 'dark' | 'light' | 'auto';
  density?: 'compact' | 'comfortable' | 'spacious';
  language?: string;
  sendShortcut?: 'enter' | 'cmdEnter';
  leftNavShortcut?: 'Comma' | 'BracketLeft';
  rightPanelShortcut?: 'Period' | 'BracketRight';
  devMode?: boolean;
  notifications?: NotificationSettings;
}

export interface SettingsPort {
  getSettings: () => Promise<AppSettings | null>;
  updateSettings: (partial: Partial<AppSettings>) => Promise<{ ok: boolean; config: AppSettings }>;
}
