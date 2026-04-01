import type { ComponentPropsWithoutRef } from 'react';
import { MermaidDiagram } from './MermaidDiagram';

type CodeProps = ComponentPropsWithoutRef<'code'> & {
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
};

function toCodeText(children: React.ReactNode): string {
  if (typeof children === 'string') return children;
  if (Array.isArray(children)) return children.map((child) => toCodeText(child)).join('');
  return '';
}

export function MarkdownCode({ inline, className, children, ...props }: CodeProps) {
  const match = /language-(\w+)/.exec(className ?? '');
  const code = toCodeText(children).replace(/\n$/, '');

  if (!inline && match?.[1] === 'mermaid') {
    return <MermaidDiagram chart={code} />;
  }

  return (
    <code className={className} {...props}>
      {children}
    </code>
  );
}
