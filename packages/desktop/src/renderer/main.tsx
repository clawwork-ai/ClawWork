import React from 'react';
import { createRoot } from 'react-dom/client';
import 'highlight.js/styles/github-dark.css';
import './styles/theme.css';
import i18n from './i18n';
import { useUiStore } from './stores/uiStore';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import { ThemeProvider } from './context/ThemeProvider';
import { resolveSystemLanguage, type Language } from './i18n/languages';
import { SUPPORTED_LANGUAGE_CODES } from '@clawwork/shared';
import type { LanguageCode } from '@clawwork/shared';

if (!window.clawwork) {
  const root = document.getElementById('root')!;
  const wrapper = document.createElement('div');
  wrapper.style.cssText =
    'display:flex;align-items:center;justify-content:center;height:100vh;color:var(--danger);font-family:monospace;padding:2rem;text-align:center';
  const heading = document.createElement('h2');
  heading.textContent = 'Preload bridge missing';
  const detail = document.createElement('p');
  detail.textContent =
    'window.clawwork is undefined. The preload script failed to expose the ClawWork API. Check that the preload is built as CJS (not ESM) when sandbox is enabled.';
  wrapper.appendChild(heading);
  wrapper.appendChild(detail);
  root.appendChild(wrapper);
  throw new Error(
    '[fatal] window.clawwork is undefined — preload bridge not loaded. Likely ESM/CJS format mismatch with sandbox:true.',
  );
}

function isValidLang(v: unknown): v is LanguageCode {
  return typeof v === 'string' && (SUPPORTED_LANGUAGE_CODES as readonly string[]).includes(v);
}

async function bootstrap() {
  let lang: Language = resolveSystemLanguage();
  let needsPersist = false;
  let settingsReadFailed = false;
  try {
    const settings = await window.clawwork.getSettings();
    const persisted = settings?.language;
    if (isValidLang(persisted)) {
      lang = persisted;
    } else {
      needsPersist = true;
    }
  } catch {
    settingsReadFailed = true;
  }

  try {
    if (lang !== i18n.language) await i18n.changeLanguage(lang);
  } catch {}

  useUiStore.setState({ language: lang });
  if (needsPersist && !settingsReadFailed) window.clawwork.updateSettings({ language: lang });

  const root = createRoot(document.getElementById('root')!);
  root.render(
    <React.StrictMode>
      <ThemeProvider>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </ThemeProvider>
    </React.StrictMode>,
  );
}
bootstrap();
