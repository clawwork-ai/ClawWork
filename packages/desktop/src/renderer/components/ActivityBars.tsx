const BARS = 5;

export default function ActivityBars({ className }: { className?: string }) {
  return (
    <div className={className} style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 16 }}>
      {Array.from({ length: BARS }, (_, i) => (
        <div
          key={i}
          style={{
            width: 3,
            height: '100%',
            borderRadius: 1,
            backgroundColor: 'var(--accent)',
            transformOrigin: 'bottom',
            animation: `bar-bounce 1.2s ease-in-out infinite`,
            animationDelay: `${i * 0.12}s`,
            ['--bar-i' as string]: i,
          }}
        />
      ))}
    </div>
  );
}
