import { I18nProvider } from './i18n/context';
import { useRoute } from './hooks/useRoute';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { InstallBlock } from './components/InstallBlock';
import { Features } from './components/Features';
import { Architecture } from './components/Architecture';
import { QuickStart } from './components/QuickStart';
import { Footer } from './components/Footer';
import { DocsLayout } from './components/DocsLayout';
import { DocPage } from './components/DocPage';

const DOC_SLUGS = ['pairing-gateway', 'pairing-pwa'];

function Router() {
  const { path, navigate } = useRoute();

  const docMatch = path.startsWith('docs/') ? path.slice(5) : null;
  if (docMatch && DOC_SLUGS.includes(docMatch)) {
    return (
      <DocsLayout navigate={navigate}>
        <DocPage slug={docMatch} />
      </DocsLayout>
    );
  }

  return (
    <>
      <Header navigate={navigate} />
      <main>
        <Hero />
        <InstallBlock />
        <Features />
        <Architecture />
        <QuickStart />
      </main>
      <Footer navigate={navigate} />
    </>
  );
}

export function App() {
  return (
    <I18nProvider>
      <Router />
    </I18nProvider>
  );
}
