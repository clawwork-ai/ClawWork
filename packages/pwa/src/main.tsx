import React from 'react';
import ReactDOM from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import './i18n';
import './styles/index.css';
import App from './App';

const updateServiceWorker = registerSW({
  immediate: true,
  onRegisteredSW(_swUrl: string, registration: ServiceWorkerRegistration | undefined) {
    if (!registration) return;
    void registration.update();
  },
});

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    updateServiceWorker();
  }
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
