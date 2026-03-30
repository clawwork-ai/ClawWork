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
    const currentPath = getPath();

    if (to.startsWith('#')) {
      if (currentPath === '') {
        document.querySelector(to)?.scrollIntoView({ behavior: 'smooth' });
        return;
      }
      window.history.pushState(null, '', base + '/' + to);
      setPath('');
      let tries = 0;
      const poll = () => {
        const el = document.querySelector(to);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
        else if (++tries < 20) requestAnimationFrame(poll);
      };
      requestAnimationFrame(poll);
      return;
    }

    if (to === currentPath) {
      window.scrollTo(0, 0);
      return;
    }

    window.history.pushState(null, '', base + '/' + to);
    setPath(to);
    window.scrollTo(0, 0);
  }, []);

  return { path, navigate };
}
