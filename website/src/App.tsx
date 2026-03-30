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
import { PairingGateway } from './components/docs/PairingGateway';
import { PairingPwa } from './components/docs/PairingPwa';

function Router() {
  const { path, navigate } = useRoute();

  if (path === 'docs/pairing-gateway') {
    return (
      <DocsLayout navigate={navigate}>
        <PairingGateway />
      </DocsLayout>
    );
  }

  if (path === 'docs/pairing-pwa') {
    return (
      <DocsLayout navigate={navigate}>
        <PairingPwa />
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
