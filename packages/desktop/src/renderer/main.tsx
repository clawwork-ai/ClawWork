import React from 'react';
import { createRoot } from 'react-dom/client';
import 'highlight.js/styles/github-dark.css';
import './styles/theme.css';
import i18n from './i18n';
import { useUiStore, type Language } from './stores/uiStore';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import { ThemeProvider } from './context/ThemeProvider';

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

// Restore persisted language preference
window.clawwork.getSettings().then((settings) => {
  const lang = settings?.language as Language | undefined;
  if (lang && lang !== i18n.language) {
    i18n.changeLanguage(lang);
    useUiStore.setState({ language: lang });
  }
});

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
