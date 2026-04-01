import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useI18n } from '../i18n/context';
import { getDoc } from '../docs/registry';
import { MarkdownCode } from './MarkdownCode';

interface DocPageProps {
  slug: string;
}

export function DocPage({ slug }: DocPageProps) {
  const { locale, t } = useI18n();
  const result = getDoc(locale, slug);

  if (!result) return null;

  const { doc, fallback } = result;

  return (
    <article className="doc-content">
      {fallback && (
        <div
          className="warning"
          style={{ borderRadius: '6px', padding: '12px 16px', marginBottom: '24px', fontSize: '14px' }}
        >
          {t.docs.noTranslation}
        </div>
      )}
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ code: MarkdownCode }}>
        {doc.content}
      </ReactMarkdown>
    </article>
  );
}
