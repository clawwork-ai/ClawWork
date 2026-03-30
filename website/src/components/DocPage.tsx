import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useI18n } from '../i18n/context';

import enPairingGateway from '../docs/en/pairing-gateway.md?raw';
import enPairingPwa from '../docs/en/pairing-pwa.md?raw';
import zhPairingGateway from '../docs/zh/pairing-gateway.md?raw';
import zhPairingPwa from '../docs/zh/pairing-pwa.md?raw';

const docs: Record<string, Record<string, string>> = {
  en: {
    'pairing-gateway': enPairingGateway,
    'pairing-pwa': enPairingPwa,
  },
  zh: {
    'pairing-gateway': zhPairingGateway,
    'pairing-pwa': zhPairingPwa,
  },
};

interface DocPageProps {
  slug: string;
}

export function DocPage({ slug }: DocPageProps) {
  const { locale } = useI18n();
  const content = docs[locale]?.[slug] ?? docs['en']?.[slug] ?? '';

  return (
    <article className="doc-content">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </article>
  );
}
