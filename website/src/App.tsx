import { I18nProvider } from './i18n/context';
import { useRoute } from './hooks/useRoute';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { InstallBlock } from './components/InstallBlock';
import { Features } from './components/Features';
import { Architecture } from './components/Architecture';
import { Footer } from './components/Footer';
import { DocsLayout } from './components/DocsLayout';
import { DocIndex } from './components/DocIndex';
import { DocPage } from './components/DocPage';
import { allSlugs } from './docs/registry';

function Router() {
  const { path, navigate } = useRoute();

  if (path === 'blogs') {
    return (
      <DocsLayout navigate={navigate}>
        <DocIndex navigate={navigate} />
      </DocsLayout>
    );
  }

  const docMatch = path.startsWith('blogs/') ? path.slice(6) : null;
  if (docMatch && allSlugs.has(docMatch)) {
    return (
      <DocsLayout navigate={navigate} backTo="blogs">
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
