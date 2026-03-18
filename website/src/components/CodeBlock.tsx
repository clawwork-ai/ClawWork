import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface CodeBlockProps {
  code: string;
  prompt?: boolean;
}

export function CodeBlock({ code, prompt = true }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{
        background: '#242424',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '6px',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        justifyContent: 'space-between',
      }}
    >
      <code
        style={{
          fontFamily: 'var(--font-mono, "JetBrains Mono Variable", monospace)',
          fontSize: '14px',
          color: '#0ffd0d',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
        }}
      >
        {code.split('\n').map((line, i) => (
          <span key={i} style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            {prompt && <span style={{ color: '#6b7280', userSelect: 'none', flexShrink: 0 }}>$</span>}
            <span style={{ wordBreak: 'break-all' }}>{line}</span>
          </span>
        ))}
      </code>
      <button
        onClick={handleCopy}
        title="Copy"
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: copied ? '#0ffd0d' : '#6b7280',
          padding: '4px',
          display: 'flex',
          alignItems: 'center',
          flexShrink: 0,
          transition: 'color 0.15s',
        }}
      >
        {copied ? <Check size={16} /> : <Copy size={16} />}
      </button>
    </div>
  );
}
