import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { HudAdapter, HudConfig, HudWallet } from '../adapter/types';

interface HudContextValue {
  adapter: HudAdapter;
  config: HudConfig;
  wallet?: HudWallet;
}

const HudContext = createContext<HudContextValue | null>(null);

export function HudProvider({
  adapter,
  config,
  wallet,
  children,
}: {
  adapter: HudAdapter;
  config: HudConfig;
  /** Мост к кошельку игры со своим TonConnect. См. `HudWallet`. Не передан —
   *  библиотека сама работает с TonConnect через React-хуки, как раньше. */
  wallet?: HudWallet;
  children: ReactNode;
}) {
  const value = useMemo(() => ({ adapter, config, wallet }), [adapter, config, wallet]);
  return (
    <HudContext.Provider value={value}>
      <I18nGuard />
      {children}
    </HudContext.Provider>
  );
}

/**
 * Инстанс i18next принадлежит игре — библиотека только подмешивает свои
 * словари. Если игра забыла их подмешать, ключи покажутся сырыми, и это
 * сложно связать с причиной. В dev-сборке говорим об этом прямо.
 */
function I18nGuard() {
  const { i18n } = useTranslation();
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    // Нет инстанса i18next вообще (нет ни I18nextProvider, ни глобальной
    // регистрации) — это отдельная проблема, не про забытые словари. Молчим.
    if (typeof i18n.exists !== 'function') return;
    if (!i18n.exists('profile.title')) {
      console.error(
        '[game-hud] Словари библиотеки не подмешаны в i18next: ключ "profile.title" ' +
          'не найден. Импортируй ресурсы из "@gonreg/game-hud/i18n" и слей их со ' +
          'своими при инициализации i18next.',
      );
    }
  }, [i18n]);
  return null;
}

function useHudContext(): HudContextValue {
  const v = useContext(HudContext);
  if (!v) throw new Error('[game-hud] Хук вызван вне HudProvider');
  return v;
}

export function useHudAdapter(): HudAdapter {
  return useHudContext().adapter;
}

export function useHudConfig(): HudConfig {
  return useHudContext().config;
}

/** Мост к кошельку, если игра его передала. Внутренний доступ для
 *  `useHudWallet` — экраны сами этот хук не вызывают. */
export function useHudWalletBridge(): HudWallet | undefined {
  return useHudContext().wallet;
}
