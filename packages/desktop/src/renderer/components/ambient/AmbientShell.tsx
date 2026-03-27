import { useEffect, useState } from 'react';

const orbs = [
  { style: 'ambient-drift-1', duration: '45s', token: '--ambient-orb-1' },
  { style: 'ambient-drift-2', duration: '60s', token: '--ambient-orb-2' },
  { style: 'ambient-drift-3', duration: '75s', token: '--ambient-orb-3' },
] as const;

export default function AmbientShell() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  if (reduced) return null;

  return (
    <>
      {orbs.map((orb) => (
        <div
          key={orb.style}
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 0,
            pointerEvents: 'none',
            backgroundImage: `var(${orb.token})`,
            animation: `${orb.style} ${orb.duration} ease-in-out infinite`,
          }}
        />
      ))}
    </>
  );
}
