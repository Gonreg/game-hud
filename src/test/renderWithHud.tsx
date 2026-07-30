import { render, type RenderResult } from '@testing-library/react';
import i18n from 'i18next';
import { initReactI18next, I18nextProvider } from 'react-i18next';
import type { ReactElement, ReactNode } from 'react';
import { HudProvider } from '../context/HudProvider';
import type { HudAdapter, HudConfig, HudWallet } from '../adapter/types';
import { makeFakeAdapter } from './fakeAdapter';
import en from '../i18n/locales/en.json';

const DEFAULT_CONFIG: HudConfig = {
  botUsername: 'test_bot',
  currency: 'GRAM',
  minBet: 0.1,
  maxBet: 100,
};

/** Рендер компонента библиотеки в боевом окружении: i18n + провайдер. */
export function renderWithHud(
  ui: ReactElement,
  opts: {
    adapter?: HudAdapter;
    config?: Partial<HudConfig>;
    wallet?: HudWallet;
    renderWallet?: () => ReactNode;
  } = {},
): RenderResult & { adapter: HudAdapter } {
  // Инстанс создаётся на каждый вызов, а не один на модуль: экран выбора языка
  // дёргает changeLanguage, и на модульном синглтоне выбранный язык протёк бы
  // во все последующие тесты файла. При статических resources init синхронный,
  // поэтому await не нужен и render остаётся синхронным.
  const testI18n = i18n.createInstance();
  void testI18n.use(initReactI18next).init({
    lng: 'en',
    fallbackLng: 'en',
    resources: { en: { translation: en } },
    interpolation: { escapeValue: false },
  });

  const adapter = opts.adapter ?? makeFakeAdapter();
  const result = render(
    <I18nextProvider i18n={testI18n}>
      <HudProvider
        adapter={adapter}
        config={{ ...DEFAULT_CONFIG, ...opts.config }}
        wallet={opts.wallet}
        renderWallet={opts.renderWallet}
      >
        {ui}
      </HudProvider>
    </I18nextProvider>,
  );
  return { ...result, adapter };
}
