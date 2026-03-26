import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';

interface MarkdownContentProps {
  content: string;
}

const ALLOWED_ELEMENTS = new Set([
  'p',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'strong',
  'em',
  'ul',
  'ol',
  'li',
  'code',
  'pre',
  'blockquote',
  'a',
  'table',
  'thead',
  'tbody',
  'tr',
  'th',
  'td',
  'hr',
  'br',
  'del',
  'input',
]);

function isSafeHref(href: string | undefined): string | undefined {
  if (!href) return href;
  const trimmed = href.trim().toLowerCase();
  if (trimmed.startsWith('javascript:') || trimmed.startsWith('data:')) return undefined;
  return href;
}

const components: Components = {
  a: ({ children, href, ...props }) => (
    <a {...props} href={isSafeHref(href)} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  ),
  input: (props) => {
    if (props.type !== 'checkbox') return null;
    return <input {...props} disabled />;
  },
};

export function MarkdownContent({ content }: MarkdownContentProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      allowedElements={Array.from(ALLOWED_ELEMENTS)}
      unwrapDisallowed
      skipHtml
      components={components}
    >
      {content}
    </ReactMarkdown>
  );
}
