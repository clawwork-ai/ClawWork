import { useState, useEffect, useCallback } from 'react';

function getPath() {
  const base = import.meta.env.BASE_URL.replace(/\/+$/, '');
  return window.location.pathname.replace(base, '').replace(/^\/+/, '') || '';
}

export function useRoute() {
  const [path, setPath] = useState(getPath);

  useEffect(() => {
    const handler = () => setPath(getPath());
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, []);

  const navigate = useCallback((to: string) => {
    const base = import.meta.env.BASE_URL.replace(/\/+$/, '');
    const hash = to.includes('#') ? to.slice(to.indexOf('#')) : '';
    const pathname = hash ? '' : to;

    window.history.pushState(null, '', base + '/' + pathname + hash);
    setPath(pathname);

    if (hash) {
      requestAnimationFrame(() => {
        document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth' });
      });
    } else {
      window.scrollTo(0, 0);
    }
  }, []);

  return { path, navigate };
}
