import { I18nProvider } from './i18n/context';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { InstallBlock } from './components/InstallBlock';
import { Features } from './components/Features';
import { Architecture } from './components/Architecture';
import { QuickStart } from './components/QuickStart';
import { Footer } from './components/Footer';

export function App() {
  return (
    <I18nProvider>
      <Header />
      <main>
        <Hero />
        <InstallBlock />
        <Features />
        <Architecture />
        <QuickStart />
      </main>
      <Footer />
    </I18nProvider>
  );
}
