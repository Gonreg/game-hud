import { createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import i18n from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { create } from 'zustand';
import { HudProvider } from './context/HudProvider';
import { ProfileShell } from './profile/ProfileShell';
import { WalletSheet } from './wallet/WalletSheet';
import { SoundSettings } from './hud/SoundSettings';
import { BalanceChip } from './hud/BalanceChip';
import { ProfileAvatarButton } from './hud/ProfileAvatarButton';
import { IconTon } from './primitives/icons';
import { useTelegramSafeArea } from './theme/useTelegramSafeArea';
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
  // Пять игр со сборщиком зовут этот хук у себя в App; у scratch-game своего
  // React нет, поэтому зовём здесь. Без него --hud-safe-* не выставлены, а на
  // них завязано позиционирование ВСЕГО худа: `top: calc(max(var(--hud-safe-top),
  // 78px) + 16px)` при неопределённой переменной невалиден целиком, и баланс,
  // аватар и шестерёнка уезжают в угол экрана под системную панель Telegram.
  useTelegramSafeArea();

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
// Адаптер/конфиг/кошелёк с последнего mount(): mountTopBar рендерит своё дерево
// отдельным React root (шапка живёт в другом узле, поверх canvas игры) и
// собирает для него такой же HudProvider.
let currentMountOptions: MountOptions | null = null;

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
  currentMountOptions = opts;
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
  currentMountOptions = null;
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

/**
 * Шапка игры: чип баланса слева и аватар справа — ровно те же компоненты и в
 * той же раскладке, что у пяти игр со сборщиком (см. `App.tsx` баша: там они
 * стоят рядом с `<SoundSettings/>`). Позиционируются сами, через CSS библиотеки
 * относительно ближайшего позиционированного предка, поэтому узел должен быть
 * растянут на весь экран.
 *
 * Существует ради scratch-game: у него нет своего React, чтобы отрендерить эти
 * компоненты, и раньше он рисовал баланс и иконки на canvas — из-за чего его
 * худ единственный выглядел иначе, чем у остальных.
 *
 * Баланс берётся из `setBalance()` и реактивен. Требует уже вызванного
 * `mount()`: нужны адаптер (аватар, кабинет) и его i18n-инстанс.
 */
export interface TopBarOptions {
  /** Иконка валюты рядом с числом. По умолчанию — TON. */
  icon?: 'ton' | 'none';
}

let topBarRoot: Root | null = null;
let topBarEl: HTMLElement | null = null;

function TopBar({ adapter, config, wallet, opts }: {
  adapter: HudAdapter;
  config: HudConfig;
  wallet: HudWallet;
  opts: TopBarOptions;
}) {
  const balance = useStandaloneStore((s) => s.balance);
  return createElement(HudProvider, {
    adapter,
    config,
    wallet,
    children: [
      createElement(BalanceChip, {
        key: 'balance',
        balance,
        icon: opts.icon === 'none' ? undefined : createElement(IconTon, { width: 18, height: 18 }),
      }),
      createElement(ProfileAvatarButton, { key: 'avatar' }),
    ],
  });
}

export function mountTopBar(el: HTMLElement, opts: TopBarOptions = {}): void {
  if (!currentI18n || !currentMountOptions) {
    throw new Error('mountTopBar: call mount() first (needs the adapter and the cabinet i18n instance)');
  }
  injectStyles();
  // root переживает повторные вызовы на тот же узел — как и у
  // mountSoundSettings: пересоздание сбрасывало бы состояние компонентов.
  if (!topBarRoot || topBarEl !== el) {
    if (topBarRoot) topBarRoot.unmount();
    topBarRoot = createRoot(el);
    topBarEl = el;
  }
  topBarRoot.render(
    createElement(I18nextProvider, {
      i18n: currentI18n,
      children: createElement(TopBar, {
        adapter: currentMountOptions.adapter,
        config: currentMountOptions.config,
        wallet: currentMountOptions.wallet,
        opts,
      }),
    }),
  );
}

export function unmountTopBar(): void {
  topBarRoot?.unmount();
  topBarRoot = null;
  topBarEl = null;
}

export interface SoundSettingsOptions {
  musicOn: boolean;
  sfxOn: boolean;
  onToggleMusic: () => void;
  onToggleSfx: () => void;
  /** Названия треков — свои у каждой игры. Без них блок подборщика скрыт. */
  tracks?: Array<{ id: string; label: string }>;
  currentTrack?: string;
  onSelectTrack?: (id: string) => void;
  onHowToPlay?: () => void;
}

let soundSettingsRoot: Root | null = null;
let soundSettingsEl: HTMLElement | null = null;

/**
 * Монтирует ПОЛНЫЙ блок звука/языка — свою плавающую шестерёнку с выпадающим
 * меню Music (+ подборщик треков) / SFX / «как играть» / язык (см.
 * `SoundSettings` — тот же компонент рендерят баш/матрёшка/джуб) — в
 * переданный узел. Для игр без сборщика со своей кнопкой-шестерёнкой в
 * топбаре (scratch-game — единственная такая на сегодня): их собственную
 * кнопку эта функция заменяет целиком, а не дополняет — иначе на экране
 * было бы две шестерёнки. Аудио-движка у библиотеки как и раньше нет: звук,
 * список треков и их состояние передаёт сама игра пропсами — а значит, в
 * отличие от mount(), этот вызов повторяется на каждое изменение состояния
 * (тумблер музыки/SFX, смена трека). Пересоздавать root на каждый такой вызов
 * было бы неверно: unmount()+createRoot() сбрасывает внутренний useState
 * компонента (открыто ли меню), и оно захлопывалось бы сразу после любого
 * клика внутри. Поэтому root переживает повторные вызовы на тот же узел —
 * пересоздаётся только при первом вызове или смене el.
 *
 * Требует, чтобы `mount()` уже был вызван — меню рендерится в ТОМ ЖЕ
 * i18n-инстансе, что и кабинет, иначе смена языка тут не подхватилась бы в
 * профиле (и наоборот) до следующего mount()/setLanguage().
 */
export function mountSoundSettings(el: HTMLElement, opts: SoundSettingsOptions): void {
  if (!currentI18n) {
    throw new Error('mountSoundSettings: call mount() first (needs the cabinet i18n instance)');
  }
  injectStyles();
  if (!soundSettingsRoot || soundSettingsEl !== el) {
    if (soundSettingsRoot) soundSettingsRoot.unmount();
    soundSettingsRoot = createRoot(el);
    soundSettingsEl = el;
  }
  soundSettingsRoot.render(createElement(I18nextProvider, { i18n: currentI18n, children: createElement(SoundSettings, opts) }));
}

export function unmountSoundSettings(): void {
  soundSettingsRoot?.unmount();
  soundSettingsRoot = null;
  soundSettingsEl = null;
}
