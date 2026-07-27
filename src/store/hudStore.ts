import { create } from 'zustand';
import type { SupportTheme } from '../adapter/types';

export type HudScreen =
  | 'hub'
  | 'wallet'
  | 'history'
  | 'referrals'
  | 'stats'
  | 'leaderboard'
  | 'notifications'
  | 'language'
  | 'help'
  | 'terms'
  | 'privacy'
  | 'offer';

interface HudState {
  open: boolean;
  screen: HudScreen;
  walletFocus: 'deposit' | 'withdraw' | null;
  helpTheme: SupportTheme | null;
  openProfile: () => void;
  openHistory: () => void;
  close: () => void;
  setScreen: (s: HudScreen) => void;
  openWalletWithFocus: (focus: 'deposit' | 'withdraw') => void;
  clearWalletFocus: () => void;
  openHelpWithTheme: (theme: SupportTheme) => void;
  clearHelpTheme: () => void;
}

/**
 * Только UI-состояние: какой экран открыт и с каким фокусом. Серверных данных
 * здесь нет — за ними ходит useHudResource через адаптер.
 *
 * Это zustand, а не React context, чтобы состояние было доступно императивно:
 * `useHudStore.getState().openProfile()` вызывается из не-React кода molot
 * и scratch-game.
 */
export const useHudStore = create<HudState>((set) => ({
  open: false,
  screen: 'hub',
  walletFocus: null,
  helpTheme: null,
  openProfile: () => set({ open: true, screen: 'hub' }),
  openHistory: () => set({ open: true, screen: 'history' }),
  close: () => set({ open: false }),
  setScreen: (screen) => set({ screen }),
  openWalletWithFocus: (focus) => set({ open: true, screen: 'wallet', walletFocus: focus }),
  // walletFocus и helpTheme — одноразовые: экран, который их применил, обязан их
  // погасить. Гасить надо в useEffect при монтировании (`if (!focus) return; …;
  // clear()`), а не в обработчике клика — тогда очистка привязана к жизненному
  // циклу экрана, а не к дисциплине разработчика в множестве мест.
  clearWalletFocus: () => set({ walletFocus: null }),
  openHelpWithTheme: (theme) => set({ open: true, screen: 'help', helpTheme: theme }),
  clearHelpTheme: () => set({ helpTheme: null }),
}));
