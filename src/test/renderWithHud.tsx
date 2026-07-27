import { render, type RenderResult } from '@testing-library/react';
import i18n from 'i18next';
import { initReactI18next, I18nextProvider } from 'react-i18next';
import type { ReactElement } from 'react';
import { HudProvider } from '../context/HudProvider';
import type { HudAdapter, HudConfig } from '../adapter/types';
import { makeFakeAdapter } from './fakeAdapter';
import en from '../i18n/locales/en.json';

const testI18n = i18n.createInstance();
void testI18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  resources: { en: { translation: en } },
  interpolation: { escapeValue: false },
});

const DEFAULT_CONFIG: HudConfig = {
  botUsername: 'test_bot',
  currency: 'GRAM',
  minBet: 0.1,
  maxBet: 100,
};

/** Рендер компонента библиотеки в боевом окружении: i18n + провайдер. */
export function renderWithHud(
  ui: ReactElement,
  opts: { adapter?: HudAdapter; config?: Partial<HudConfig> } = {},
): RenderResult & { adapter: HudAdapter } {
  const adapter = opts.adapter ?? makeFakeAdapter();
  const result = render(
    <I18nextProvider i18n={testI18n}>
      <HudProvider adapter={adapter} config={{ ...DEFAULT_CONFIG, ...opts.config }}>
        {ui}
      </HudProvider>
    </I18nextProvider>,
  );
  return { ...result, adapter };
}
