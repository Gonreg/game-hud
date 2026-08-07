import { createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import i18n from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { create } from 'zustand';
import { HudProvider } from './context/HudProvider';
import { ProfileShell } from './profile/ProfileShell';
import { WalletSheet } from './wallet/WalletSheet';
import { SettingsMenu } from './hud/SettingsMenu';
import { useHudStore } from './store/hudStore';
import { hudLocales, mergeHudLocales, RTL_LANGUAGES, SUPPORTED_LANGUAGES } from './i18n';
import type { HudAdapter, HudConfig, HudWallet } from './adapter/types';
import cssText from './theme/styles.css?inline';

/**
 * Публичный API самодостаточного бандла (`dist/standalone.js`) для игр без
 * сборщика — см. шапку задачи в 0.4.0. Наружу через `window.GameHud`: этот
 * модуль — единственная точка входа `vite.standalone.config.ts`, и всё, что
 * он экспортирует, IIFE-сборка кладёт в глобальную переменную `GameHud`.
 */
export interface MountOptions {
  adapter: HudAdapter;
  config: HudConfig;
  wallet: HudWallet;
  /** Словари игры, сливаются с библиотечными; игровые ключи побеждают. */
  locales?: Record<string, Record<string, unknown>>;
  /** Начальный язык. По умолчанию — определяется из Telegram, иначе 'en'. */
  language?: string;
}

type Dict = Record<string, unknown>;

interface StandaloneState {
  balance: number | null;
  walletSheetOpen: boolean;
  setBalance: (value: number | null) => void;
  openWalletSheet: () => void;
  closeWalletSheet: () => void;
  reset: () => void;
}

/**
 * Состояние, которого нет в библиотечном `useHudStore`: боттом-шит кошелька
 * (`WalletSheet`) в остальных пяти играх открывает и закрывает стор самой
 * игры, а `openWallet()`/`setBalance()` этого бандла — его роль здесь.
 */
const useStandaloneStore = create<StandaloneState>((set) => ({
  balance: null,
  walletSheetOpen: false,
  setBalance: (balance) => set({ balance }),
  openWalletSheet: () => set({ walletSheetOpen: true }),
  closeWalletSheet: () => set({ walletSheetOpen: false }),
  reset: () => set({ balance: null, walletSheetOpen: false }),
}));

/**
 * Сливает словари игры с библиотечными для каждого языка, который есть хоть
 * в одном из двух наборов. Библиотечные ключи побеждают только там, где игра
 * не задала свой (см. `mergeHudLocales`).
 */
function buildResources(gameLocales: Record<string, Dict> | undefined): Record<string, { translation: Dict }> {
  const languages = new Set<string>(SUPPORTED_LANGUAGES);
  for (const lang of Object.keys(gameLocales ?? {})) languages.add(lang);

  const resources: Record<string, { translation: Dict }> = {};
  for (const lang of languages) {
    const hud = (hudLocales as Record<string, Dict>)[lang] ?? {};
    const game = gameLocales?.[lang] ?? {};
    resources[lang] = { translation: mergeHudLocales(hud as never, game as never) };
  }
  return resources;
}

function detectLanguage(): string {
  return window.Telegram?.WebApp?.initDataUnsafe?.user?.language_code ?? 'en';
}

/** Как и `LanguageScreen`: библиотека не владеет инстансом i18next игры (тут
 *  владеет — но тот же принцип держим для симметрии), поэтому lang/dir на
 *  `<html>` ставит сама, при монтировании и при каждой смене языка. */
function applyDocumentLanguage(lang: string): void {
  document.documentElement.lang = lang;
  document.documentElement.dir = RTL_LANGUAGES.has(lang) ? 'rtl' : 'ltr';
}

let cssInjected = false;

/** CSS темы вшит в JS-бандл через `?inline` (см. импорт `cssText` выше) —
 *  инжектим его тегом `<style>` при первом монтировании, чтобы игре не
 *  пришлось подключать `styles.css` отдельным тегом. */
function injectStyles(): void {
  if (cssInjected) return;
  const style = document.createElement('style');
  style.textContent = cssText;
  document.head.appendChild(style);
  cssInjected = true;
}

function StandaloneApp({
  adapter,
  config,
  wallet,
  i18nInstance,
}: {
  adapter: HudAdapter;
  config: HudConfig;
  wallet: HudWallet;
  i18nInstance: ReturnType<typeof i18n.createInstance>;
}) {
  const balance = useStandaloneStore((s) => s.balance);
  const walletSheetOpen = useStandaloneStore((s) => s.walletSheetOpen);
  const closeWalletSheet = useStandaloneStore((s) => s.closeWalletSheet);

  return createElement(I18nextProvider, {
    i18n: i18nInstance,
    children: createElement(HudProvider, {
      adapter,
      config,
      wallet,
      children: [
        createElement(ProfileShell, { key: 'profile' }),
        createElement(WalletSheet, {
          key: 'wallet-sheet',
          open: walletSheetOpen,
          onClose: closeWalletSheet,
          balance,
        }),
      ],
    }),
  });
}

let root: Root | null = null;
let currentI18n: ReturnType<typeof i18n.createInstance> | null = null;

/** Монтирует кабинет (`ProfileShell`) и боттом-шит кошелька (`WalletSheet`) в
 *  переданный узел. `BalanceChip`, `ProfileAvatarButton`, `SoundSettings` не
 *  монтируются — у scratch-game свой HUD поверх canvas, игра открывает
 *  кабинет своими кнопками через `openProfile()`/`openWallet()`. */
export function mount(el: HTMLElement, opts: MountOptions): void {
  // Повторный mount() без unmount() между вызовами — оставлять старый root и
  // i18n-инстанс висеть было бы утечкой и источником рассинхрона.
  if (root) unmount();

  injectStyles();

  const language = opts.language ?? detectLanguage();
  const instance = i18n.createInstance();
  // Ресурсы статические — init синхронный, как и в renderWithHud (см. его
  // комментарий), поэтому рендерить дерево сразу после можно без await.
  void instance.use(initReactI18next).init({
    lng: language,
    fallbackLng: 'en',
    resources: buildResources(opts.locales),
    interpolation: { escapeValue: false },
  });
  currentI18n = instance;
  applyDocumentLanguage(language);

  root = createRoot(el);
  root.render(
    createElement(StandaloneApp, {
      adapter: opts.adapter,
      config: opts.config,
      wallet: opts.wallet,
      i18nInstance: instance,
    }),
  );
}

export function unmount(): void {
  root?.unmount();
  root = null;
  currentI18n = null;
  useHudStore.setState({ open: false, screen: 'hub', walletFocus: null, helpTheme: null });
  useStandaloneStore.getState().reset();
}

/** Открыть кабинет на хабе. */
export function openProfile(): void {
  useHudStore.getState().openProfile();
}

/** Открыть боттом-шит кошелька — быстрый доступ к депозиту/выводу поверх
 *  раунда, отдельно от кабинета (см. `WalletSheet`). */
export function openWallet(): void {
  useStandaloneStore.getState().openWalletSheet();
}

/** Открыть кабинет на экране истории. */
export function openHistory(): void {
  useHudStore.getState().openHistory();
}

/** Закрыть и кабинет, и боттом-шит кошелька — что бы из них ни было открыто. */
export function close(): void {
  useHudStore.getState().close();
  useStandaloneStore.getState().closeWalletSheet();
}

/** Баланс в дробных единицах отображения — как и везде в контракте.
 *  Реагирует смонтированный `WalletSheet` (принимает баланс пропсом);
 *  `ProfileShell` баланс всегда берёт из `adapter.getMe()`, как и в пяти
 *  React-играх. */
export function setBalance(value: number | null): void {
  useStandaloneStore.getState().setBalance(value);
}

export function setLanguage(lang: string): void {
  if (!currentI18n) return;
  void currentI18n.changeLanguage(lang);
  applyDocumentLanguage(lang);
}

export interface SettingsMenuOptions {
  onHowToPlay: () => void;
  musicOn?: boolean;
  sfxOn?: boolean;
  onToggleMusic?: () => void;
  onToggleSfx?: () => void;
}

let settingsRoot: Root | null = null;

/**
 * Монтирует содержимое выпадающего меню шестерёнки (Music/SFX/How to play/
 * Language — см. `SettingsMenu`) в переданный узел, для игр без сборщика со
 * своей кнопкой-шестерёнкой в топбаре (scratch-game — единственная такая на
 * сегодня). Подборщик треков сюда не входит (см. комментарий в SettingsMenu):
 * список треков знает только звуковой движок игры, рисует его сама игра
 * рядом с этим меню, как и остальные пять игр делают у себя.
 *
 * Требует, чтобы `mount()` уже был вызван — меню рендерится в ТОМ ЖЕ
 * i18n-инстансе, что и кабинет, иначе смена языка тут не подхватилась бы в
 * профиле (и наоборот) до следующего mount()/setLanguage().
 */
export function mountSettingsMenu(el: HTMLElement, opts: SettingsMenuOptions): void {
  if (!currentI18n) {
    throw new Error('mountSettingsMenu: call mount() first (needs the cabinet i18n instance)');
  }
  injectStyles();
  if (settingsRoot) settingsRoot.unmount();
  settingsRoot = createRoot(el);
  settingsRoot.render(createElement(I18nextProvider, { i18n: currentI18n, children: createElement(SettingsMenu, opts) }));
}

export function unmountSettingsMenu(): void {
  settingsRoot?.unmount();
  settingsRoot = null;
}
