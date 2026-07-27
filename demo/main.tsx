import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { TonConnectUIProvider } from '@tonconnect/ui-react';
import { HudProvider, ProfileShell, TopBar, BetAmountInput, useHudStore } from '../src';
import { hudLocales } from '../src/i18n';
import { makeFakeAdapter } from '../src/test/fakeAdapter';
import '../src/theme/styles.css';

void i18n.use(initReactI18next).init({
  lng: 'ru',
  fallbackLng: 'en',
  resources: Object.fromEntries(
    Object.entries(hudLocales).map(([lang, dict]) => [lang, { translation: dict }]),
  ),
  interpolation: { escapeValue: false },
});

const adapter = makeFakeAdapter();

function Demo() {
  const [bet, setBet] = useState(1);
  const open = useHudStore((s) => s.openProfile);
  return (
    <HudProvider
      adapter={adapter}
      config={{ botUsername: 'demo_bot', currency: 'GRAM', minBet: 0.1, maxBet: 100 }}
    >
      <div style={{ position: 'fixed', inset: 0, background: 'var(--hud-bg-0)' }}>
        <TopBar balance={12.5} onHowToPlay={() => {}} />
        <div style={{ position: 'absolute', bottom: 24, left: 12, right: 12 }}>
          <BetAmountInput value={bet} onChange={setBet} min={0.1} max={100} balance={12.5} />
          <button type="button" onClick={open} style={{ marginTop: 12 }}>
            открыть кабинет
          </button>
        </div>
        <ProfileShell />
      </div>
    </HudProvider>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TonConnectUIProvider manifestUrl="https://ton-connect.github.io/demo-dapp/tonconnect-manifest.json">
      <Demo />
    </TonConnectUIProvider>
  </StrictMode>,
);
