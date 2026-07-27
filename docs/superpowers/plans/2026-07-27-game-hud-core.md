# game-hud — библиотека + интеграция fatman. План реализации

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Собрать npm-пакет `@gonreg/game-hud` с личным кабинетом, верхним HUD и вводом ставки, и перевести fatman на него так, чтобы дублирующийся код из fatman исчез.

**Architecture:** Чистый UI-kit без сетевого кода. Игра реализует интерфейс `HudAdapter` и передаёт его в `HudProvider`; библиотека владеет разметкой, стилями, состояниями загрузки и UI-состоянием (zustand). Единая тема JUBB, все классы под префиксом `hud-`. Порт делается из fatman как из самой полной реализации, плюс четыре точечных улучшения из matreshka.

**Tech Stack:** TypeScript 5.9, React 18, Vite 6 (library mode), vite-plugin-dts, vitest + jsdom + @testing-library/react, zustand 5, i18next 23 / react-i18next 15, @tonconnect/ui-react 2, react-window 1.8.

**Спека:** `docs/superpowers/specs/2026-07-27-game-hud-design.md`

---

## Справочник путей

Исходники, из которых портируем (только на чтение, менять их нельзя до части G):

```
F  = /Users/ivan/PhpStormProjects/fatman/frontend/src
M  = /Users/ivan/PhpStormProjects/matreshka/frontend/src
L  = /Users/ivan/PhpStormProjects/game-hud          (наш пакет)
```

## Правила порта (T1–T7)

Каждая задача части D и E ссылается на эти правила и добавляет свои конкретные замены.
Правила применяются к скопированному файлу целиком.

- **T1 — импорты данных.** Убрать `import { api } from '@/lib/api'` и
  `import { useAuthStore } from '@/store/authStore'`. Вместо `api.getX(token, ...)`
  вызывать `adapter.getX(...)`, где `const adapter = useHudAdapter()`. Токена в
  библиотеке нет вообще — его держит адаптер игры.
- **T2 — стор.** `import { useProfileStore } from '@/store/profileStore'` →
  `import { useHudStore } from '../store/hudStore'`. Имена полей и методов совпадают.
- **T3 — типы.** `import { type XResponse } from '@/lib/api'` →
  `import { type X } from '../adapter/types'`. Суффикс `Response` из имён убран:
  `MeResponse` → `Me`, `StatsResponse` → `Stats`, `LeaderboardResponse` → `Leaderboard`,
  `ReferralsResponse` → `Referrals`, `PercentilesResponse` → `Percentiles`,
  `DepositResponse` → `Deposit`.
- **T4 — CSS-классы.** Каждый строковый литерал класса получает префикс `hud-`:
  `className="profile-hub__name"` → `className="hud-profile-hub__name"`. То же в
  `styles.css`. Классы, начинающиеся с `hud-`, повторно не префиксуются.
- **T5 — форматирование денег.** Любые `(x ?? 0).toFixed(2)` и `x.toFixed(2)` над
  денежными полями → `fmtAmount(x)` из `../format/money`. Коэффициенты и проценты
  не трогать.
- **T6 — загрузка.** Ручные связки `useState` + `useEffect` + `cancelled` над одним
  запросом → `useHudResource(key, fetcher)`. Экраны с курсорной пагинацией
  (`HistoryScreen`) правило не применяют.
- **T7 — точка с запятой и кавычки.** Исходники fatman в стиле prettier с точками
  с запятой и одинарными кавычками — сохраняем его во всём пакете.

---

## Карта файлов

```
L/package.json                 манифест, три точки входа, prepare-сборка
L/tsconfig.json                strict, jsx: react-jsx
L/vite.config.ts               library mode + dts + vitest
L/vitest.setup.ts              jest-dom, мок Telegram.WebApp
L/src/index.ts                 публичные экспорты
L/src/adapter/types.ts         HudAdapter + модели данных
L/src/store/hudStore.ts        zustand: открытый экран, фокус кошелька, тема саппорта
L/src/context/HudProvider.tsx  провайдер adapter + config, dev-проверка i18n
L/src/context/useHudResource.ts  загрузка/ошибка/reload поверх адаптера
L/src/format/money.ts          fmtAmount
L/src/theme/styles.css         единая тема JUBB
L/src/theme/useTelegramSafeArea.ts
L/src/primitives/icons.tsx     объединённый набор stroke-иконок
L/src/primitives/BottomSheet.tsx
L/src/primitives/InfoPopover.tsx
L/src/primitives/Skeleton.tsx
L/src/profile/ProfileShell.tsx + 11 экранов + LegalFooter.tsx
L/src/wallet/WalletSheet.tsx
L/src/hud/BalanceChip.tsx ProfileAvatarButton.tsx SettingsButton.tsx
        SettingsMenu.tsx SoundSettings.tsx TopBar.tsx
L/src/bet/useBetAmount.ts BetAmountInput.tsx
L/src/i18n/index.ts + locales/{10 языков}.json
L/src/test/renderWithHud.tsx   тестовый хелпер: провайдер + i18n + фейковый адаптер
L/demo/main.tsx demo/index.html  страница ручной проверки
```

В fatman (часть G):

```
F/hud/adapter.ts               реализация HudAdapter поверх F/lib/api.ts
F/main.tsx                     оборачивание в HudProvider, подмешивание словарей
F/App.tsx                      замена локальных компонентов на библиотечные
```

---

# Часть A. Каркас пакета

### Task 1: Инициализация пакета

**Files:**
- Create: `L/package.json`, `L/tsconfig.json`, `L/vite.config.ts`, `L/vitest.setup.ts`, `L/src/index.ts`, `L/src/format/money.ts`, `L/src/format/money.test.ts`

- [ ] **Step 1: Создать манифест**

`L/package.json`:

```json
{
  "name": "@gonreg/game-hud",
  "version": "0.1.0",
  "type": "module",
  "files": ["dist"],
  "exports": {
    ".": { "types": "./dist/index.d.ts", "import": "./dist/index.js" },
    "./styles.css": "./dist/style.css",
    "./i18n": { "types": "./dist/i18n/index.d.ts", "import": "./dist/i18n.js" }
  },
  "scripts": {
    "build": "vite build",
    "dev": "vite --open /demo/index.html",
    "test": "vitest run",
    "typecheck": "tsc --noEmit",
    "prepare": "npm run build"
  },
  "dependencies": {
    "react-window": "^1.8.11"
  },
  "peerDependencies": {
    "@tonconnect/ui-react": "^2.4.4",
    "i18next": "^23.11.5",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-i18next": "^15.0.0",
    "zustand": "^5.0.0"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.9.1",
    "@testing-library/react": "^16.3.2",
    "@testing-library/user-event": "^14.5.2",
    "@tonconnect/ui-react": "^2.4.4",
    "@types/react": "^18.3.30",
    "@types/react-dom": "^18.3.7",
    "@types/react-window": "^1.8.8",
    "@vitejs/plugin-react": "^4.3.4",
    "i18next": "^23.16.8",
    "jsdom": "^29.1.1",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-i18next": "^15.7.4",
    "typescript": "^5.9.3",
    "vite": "^6.0.0",
    "vite-plugin-dts": "^4.3.0",
    "vitest": "^2.1.8",
    "zustand": "^5.0.14"
  }
}
```

- [ ] **Step 2: Создать tsconfig и конфиг сборки**

`L/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "skipLibCheck": true,
    "noEmit": true,
    "types": ["vitest/globals", "@testing-library/jest-dom"]
  },
  "include": ["src", "demo", "vitest.setup.ts"]
}
```

`L/vite.config.ts`:

```ts
// defineConfig берём из 'vitest/config', а не из 'vite': только там в типе есть
// поле `test`, иначе npm run typecheck падает на конфиге.
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
import path from 'node:path';

export default defineConfig({
  plugins: [react(), dts({ include: ['src'], rollupTypes: false })],
  build: {
    lib: {
      entry: {
        index: path.resolve(__dirname, 'src/index.ts'),
        i18n: path.resolve(__dirname, 'src/i18n/index.ts'),
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        'i18next',
        'react-i18next',
        '@tonconnect/ui-react',
        'zustand',
      ],
    },
    cssCodeSplit: false,
    sourcemap: true,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    css: false,
  },
});
```

`L/vitest.setup.ts`:

```ts
import '@testing-library/jest-dom/vitest';

// Библиотека читает Telegram.WebApp в нескольких местах (аватар, BackButton,
// safe-area). В jsdom его нет — ставим минимальный мок, тесты переопределяют
// нужные куски точечно.
Object.defineProperty(window, 'Telegram', {
  writable: true,
  configurable: true,
  value: {
    WebApp: {
      initDataUnsafe: { user: { id: 1, first_name: 'Test', username: 'test' } },
      BackButton: { show: () => {}, hide: () => {}, onClick: () => {}, offClick: () => {} },
      HapticFeedback: { impactOccurred: () => {} },
      safeAreaInset: { top: 0, right: 0, bottom: 0, left: 0 },
      contentSafeAreaInset: { top: 0, right: 0, bottom: 0, left: 0 },
      isFullscreen: false,
      onEvent: () => {},
      offEvent: () => {},
      ready: () => {},
      expand: () => {},
    },
  },
});
```

- [ ] **Step 3: Написать падающий тест форматтера**

`L/src/format/money.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { fmtAmount } from './money';

describe('fmtAmount', () => {
  it('печатает две значащие цифры после запятой', () => {
    expect(fmtAmount(1.5)).toBe('1.50');
    expect(fmtAmount(0)).toBe('0.00');
    expect(fmtAmount(1234.567)).toBe('1234.57');
  });

  it('считает null и undefined нулём, а не падает', () => {
    expect(fmtAmount(null)).toBe('0.00');
    expect(fmtAmount(undefined)).toBe('0.00');
  });

  it('не превращает NaN и Infinity в мусор на экране', () => {
    expect(fmtAmount(Number.NaN)).toBe('0.00');
    expect(fmtAmount(Number.POSITIVE_INFINITY)).toBe('0.00');
  });

  it('печатает отрицательные суммы со знаком', () => {
    expect(fmtAmount(-3.2)).toBe('-3.20');
  });
});
```

- [ ] **Step 4: Установить зависимости и убедиться, что тест падает**

Run:
```bash
cd /Users/ivan/PhpStormProjects/game-hud && npm install && npx vitest run src/format/money.test.ts
```
Expected: FAIL — `Failed to resolve import "./money"`.

- [ ] **Step 5: Написать форматтер**

`L/src/format/money.ts`:

```ts
/**
 * Единственный форматтер денег в библиотеке.
 *
 * Библиотека работает только в дробных единицах отображения: 1.5 значит
 * полторы монеты. Нормализация из нано-единиц — ответственность адаптера игры
 * (см. спеку, раздел «Единицы фиксируем жёстко»).
 */
export function fmtAmount(value: number | null | undefined): string {
  const n = typeof value === 'number' && Number.isFinite(value) ? value : 0;
  return n.toFixed(2);
}
```

- [ ] **Step 6: Создать заглушку публичного экспорта**

`L/src/index.ts`:

```ts
export { fmtAmount } from './format/money';
```

- [ ] **Step 7: Прогнать тест и типы**

Run:
```bash
cd /Users/ivan/PhpStormProjects/game-hud && npx vitest run && npm run typecheck
```
Expected: 4 passed, типы без ошибок.

- [ ] **Step 8: Коммит**

```bash
cd /Users/ivan/PhpStormProjects/game-hud
git add package.json package-lock.json tsconfig.json vite.config.ts vitest.setup.ts src/
git commit -m "feat(pkg): каркас пакета game-hud и форматтер денег"
```

---

### Task 2: Типы адаптера и моделей

**Files:**
- Create: `L/src/adapter/types.ts`
- Modify: `L/src/index.ts`

- [ ] **Step 1: Написать типы**

Источник форм — `F/lib/api.ts`. Суффикс `Response` из имён убираем (правило T3).

`L/src/adapter/types.ts`:

```ts
export interface Me {
  id: string;
  tgId: string;
  tgUsername: string | null;
  tgFirstName: string | null;
  balance: number;
  bonusBalance: number;
  refBalance: number;
  refCode: string | null;
  refLink: string | null;
  walletAddress: string | null;
}

export interface Transaction {
  id: string;
  kind: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  refId: string | null;
  createdAt: string;
}

export interface Stats {
  roundsPlayed: number;
  bestMultiplier: number;
  totalWagered: number;
  totalWon: number;
  netProfit: number;
  winrate: number;
  bestStreak: number;
  avgBet: number;
  biggestWin: number;
  biggestLoss: number;
  worstStreak: number;
  todayBets: number;
  todayProfit: number;
  weekBets: number;
  weekProfit: number;
}

export interface Percentiles {
  rounds: number | null;
  bestMult: number | null;
  winrate: number | null;
  profit: number | null;
  avgBet: number | null;
}

export interface ReferralInvitee {
  id: string;
  firstName: string | null;
  username: string | null;
  joinedAt: string;
  earnedFromThemTon: number;
}

export interface Referrals {
  refCode: string | null;
  refLink: string | null;
  invitedCount: number;
  totalEarnedTon: number;
  ratePercent: number;
  refBalance: number;
  invitees: ReferralInvitee[];
}

export type LeaderboardMode = 'profit' | 'multiplier' | 'turnover' | 'loss';
export type LeaderboardWindow = '1d' | '3d' | '7d' | '14d' | '30d' | 'all';

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string | null;
  username: string | null;
  profit: number;
  bestMultiplier: number;
  turnover: number;
  loss: number;
  rounds: number;
  isFriend: boolean;
}

export interface Leaderboard {
  mode: LeaderboardMode;
  window: LeaderboardWindow;
  top: LeaderboardEntry[];
  me: LeaderboardEntry | null;
}

export interface NotificationPrefs {
  deposit_credited: boolean;
  withdraw_confirmed: boolean;
  withdraw_failed: boolean;
  referral_joined: boolean;
  referral_earned: boolean;
  referral_big_win: boolean;
  big_win_self: boolean;
  cashback_credited: boolean;
  bonus_expiring: boolean;
  inactive_48h: boolean;
  comeback_7d: boolean;
}

export interface Deposit {
  address: string;
  comment: string;
  note: string;
}

export interface Withdrawal {
  id: string;
  amount: number;
  status: string;
  address: string | null;
  createdAt: string;
}

export type SupportTheme = 'finance' | 'game' | 'account' | 'bug' | 'partner' | 'other';

/**
 * Всё, что библиотека умеет попросить у игры. Сетевого кода внутри библиотеки
 * нет — каждая игра реализует этот интерфейс поверх своего бэка.
 *
 * Все денежные суммы — в дробных единицах отображения, в обе стороны.
 */
export interface HudAdapter {
  getMe(): Promise<Me>;
  getStats(): Promise<Stats>;
  getPercentiles(): Promise<Percentiles>;
  getLeaderboard(mode: LeaderboardMode, window: LeaderboardWindow): Promise<Leaderboard>;
  getReferrals(): Promise<Referrals>;
  getTransactions(cursor?: string): Promise<{ items: Transaction[]; nextCursor: string | null }>;
  getNotificationPrefs(): Promise<NotificationPrefs>;
  putNotificationPrefs(prefs: Partial<NotificationPrefs>): Promise<NotificationPrefs>;
  getDeposit(): Promise<Deposit>;
  postWithdraw(amount: number, address: string | null): Promise<void>;
  postSupport(text: string, theme: SupportTheme, files: File[]): Promise<void>;

  /** Есть не у всех бэков — блок «привязать кошелёк» рендерится только с ним. */
  postWalletLink?(address: string): Promise<void>;
  /** Есть не у всех бэков — список выводов рендерится только с ним. */
  getWithdrawals?(): Promise<Withdrawal[]>;
}

export interface HudConfig {
  /** Юзернейм бота без «@» — для реф-ссылок и футера уведомлений. */
  botUsername: string;
  /** Подпись валюты на экранах: GRAM, TON. */
  currency: string;
  minBet: number;
  maxBet: number;
}
```

- [ ] **Step 2: Экспортировать типы**

`L/src/index.ts` — заменить содержимое на:

```ts
export { fmtAmount } from './format/money';
export type * from './adapter/types';
```

- [ ] **Step 3: Проверить типы**

Run: `cd /Users/ivan/PhpStormProjects/game-hud && npm run typecheck`
Expected: без ошибок.

- [ ] **Step 4: Коммит**

```bash
cd /Users/ivan/PhpStormProjects/game-hud
git add src/adapter/types.ts src/index.ts
git commit -m "feat(adapter): контракт HudAdapter и модели данных"
```

---

### Task 3: UI-стор

**Files:**
- Create: `L/src/store/hudStore.ts`, `L/src/store/hudStore.test.ts`

- [ ] **Step 1: Написать падающий тест**

`L/src/store/hudStore.test.ts`:

```ts
import { beforeEach, describe, expect, it } from 'vitest';
import { useHudStore } from './hudStore';

describe('useHudStore', () => {
  beforeEach(() => {
    useHudStore.setState({ open: false, screen: 'hub', walletFocus: null, helpTheme: null });
  });

  it('стартует закрытым на хабе', () => {
    const s = useHudStore.getState();
    expect(s.open).toBe(false);
    expect(s.screen).toBe('hub');
  });

  it('openProfile открывает хаб', () => {
    useHudStore.getState().openProfile();
    expect(useHudStore.getState()).toMatchObject({ open: true, screen: 'hub' });
  });

  it('openWalletWithFocus раскрывает оверлей, а не только меняет экран', () => {
    // Баг fatman: там open оставался false, и тап по баланс-пилюле не открывал ничего.
    useHudStore.getState().openWalletWithFocus('deposit');
    expect(useHudStore.getState()).toMatchObject({
      open: true,
      screen: 'wallet',
      walletFocus: 'deposit',
    });
  });

  it('clearWalletFocus гасит фокус, не закрывая экран', () => {
    useHudStore.getState().openWalletWithFocus('withdraw');
    useHudStore.getState().clearWalletFocus();
    expect(useHudStore.getState()).toMatchObject({ screen: 'wallet', walletFocus: null });
  });

  it('openHistory открывает историю из закрытого состояния', () => {
    useHudStore.getState().openHistory();
    expect(useHudStore.getState()).toMatchObject({ open: true, screen: 'history' });
  });

  it('openHelpWithTheme открывает саппорт с выбранной темой', () => {
    useHudStore.getState().openHelpWithTheme('finance');
    expect(useHudStore.getState()).toMatchObject({
      open: true,
      screen: 'help',
      helpTheme: 'finance',
    });
  });

  it('close закрывает оверлей', () => {
    useHudStore.getState().openProfile();
    useHudStore.getState().close();
    expect(useHudStore.getState().open).toBe(false);
  });
});
```

- [ ] **Step 2: Убедиться, что тест падает**

Run: `cd /Users/ivan/PhpStormProjects/game-hud && npx vitest run src/store/hudStore.test.ts`
Expected: FAIL — `Failed to resolve import "./hudStore"`.

- [ ] **Step 3: Написать стор**

`L/src/store/hudStore.ts`:

```ts
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
  clearWalletFocus: () => set({ walletFocus: null }),
  openHelpWithTheme: (theme) => set({ open: true, screen: 'help', helpTheme: theme }),
  clearHelpTheme: () => set({ helpTheme: null }),
}));
```

- [ ] **Step 4: Прогнать тесты**

Run: `cd /Users/ivan/PhpStormProjects/game-hud && npx vitest run src/store/hudStore.test.ts`
Expected: 7 passed.

- [ ] **Step 5: Коммит**

```bash
cd /Users/ivan/PhpStormProjects/game-hud
git add src/store/
git commit -m "feat(store): UI-стор кабинета с императивным доступом"
```

---

### Task 4: Провайдер и тестовый хелпер

**Files:**
- Create: `L/src/context/HudProvider.tsx`, `L/src/context/HudProvider.test.tsx`, `L/src/test/renderWithHud.tsx`, `L/src/test/fakeAdapter.ts`

- [ ] **Step 1: Написать фейковый адаптер для тестов**

`L/src/test/fakeAdapter.ts`:

```ts
import { vi } from 'vitest';
import type {
  Deposit,
  HudAdapter,
  Leaderboard,
  Me,
  NotificationPrefs,
  Percentiles,
  Referrals,
  Stats,
  Transaction,
} from '../adapter/types';

export const FAKE_ME: Me = {
  id: 'u1',
  tgId: '1',
  tgUsername: 'test',
  tgFirstName: 'Test',
  balance: 12.5,
  bonusBalance: 3,
  refBalance: 1.25,
  refCode: 'ABC123',
  refLink: 'https://t.me/test_bot?start=ABC123',
  walletAddress: null,
};

export const FAKE_STATS: Stats = {
  roundsPlayed: 42,
  bestMultiplier: 7.31,
  totalWagered: 100,
  totalWon: 120,
  netProfit: 20,
  winrate: 0.55,
  bestStreak: 4,
  avgBet: 2.4,
  biggestWin: 30,
  biggestLoss: 12,
  worstStreak: 3,
  todayBets: 5,
  todayProfit: 2,
  weekBets: 20,
  weekProfit: 8,
};

export const FAKE_PERCENTILES: Percentiles = {
  rounds: 60,
  bestMult: 80,
  winrate: 55,
  profit: 70,
  avgBet: 40,
};

export const FAKE_REFERRALS: Referrals = {
  refCode: 'ABC123',
  refLink: 'https://t.me/test_bot?start=ABC123',
  invitedCount: 2,
  totalEarnedTon: 1.25,
  ratePercent: 10,
  refBalance: 1.25,
  invitees: [
    {
      id: 'i1',
      firstName: 'Ann',
      username: 'ann',
      joinedAt: '2026-07-01T10:00:00.000Z',
      earnedFromThemTon: 1,
    },
  ],
};

export const FAKE_LEADERBOARD: Leaderboard = {
  mode: 'profit',
  window: '7d',
  top: [
    {
      rank: 1,
      userId: 'u9',
      name: 'Top',
      username: 'top',
      profit: 99,
      bestMultiplier: 12,
      turnover: 500,
      loss: 0,
      rounds: 80,
      isFriend: false,
    },
  ],
  me: null,
};

export const FAKE_PREFS: NotificationPrefs = {
  deposit_credited: true,
  withdraw_confirmed: true,
  withdraw_failed: true,
  referral_joined: false,
  referral_earned: false,
  referral_big_win: false,
  big_win_self: true,
  cashback_credited: false,
  bonus_expiring: false,
  inactive_48h: false,
  comeback_7d: false,
};

export const FAKE_DEPOSIT: Deposit = {
  address: 'EQTestAddress',
  comment: 'u1',
  note: 'Отправь на этот адрес',
};

export const FAKE_TX: Transaction = {
  id: 't1',
  kind: 'deposit',
  amount: 5,
  balanceBefore: 7.5,
  balanceAfter: 12.5,
  refId: null,
  createdAt: '2026-07-20T09:00:00.000Z',
};

/** Адаптер, у которого всё резолвится. Переопредели нужный метод в тесте. */
export function makeFakeAdapter(over: Partial<HudAdapter> = {}): HudAdapter {
  return {
    getMe: vi.fn(async () => FAKE_ME),
    getStats: vi.fn(async () => FAKE_STATS),
    getPercentiles: vi.fn(async () => FAKE_PERCENTILES),
    getLeaderboard: vi.fn(async () => FAKE_LEADERBOARD),
    getReferrals: vi.fn(async () => FAKE_REFERRALS),
    getTransactions: vi.fn(async () => ({ items: [FAKE_TX], nextCursor: null })),
    getNotificationPrefs: vi.fn(async () => FAKE_PREFS),
    putNotificationPrefs: vi.fn(async (p) => ({ ...FAKE_PREFS, ...p })),
    getDeposit: vi.fn(async () => FAKE_DEPOSIT),
    postWithdraw: vi.fn(async () => {}),
    postSupport: vi.fn(async () => {}),
    ...over,
  };
}

/** Адаптер, у которого всё падает — для проверки экранов ошибок. */
export function makeFailingAdapter(message = 'boom'): HudAdapter {
  const fail = vi.fn(async () => {
    throw new Error(message);
  });
  return makeFakeAdapter({
    getMe: fail as never,
    getStats: fail as never,
    getPercentiles: fail as never,
    getLeaderboard: fail as never,
    getReferrals: fail as never,
    getTransactions: fail as never,
    getNotificationPrefs: fail as never,
    getDeposit: fail as never,
  });
}
```

- [ ] **Step 2: Написать падающий тест провайдера**

`L/src/context/HudProvider.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { HudProvider, useHudAdapter, useHudConfig } from './HudProvider';
import { makeFakeAdapter } from '../test/fakeAdapter';

function Probe() {
  const adapter = useHudAdapter();
  const config = useHudConfig();
  return (
    <div>
      <span data-testid="currency">{config.currency}</span>
      <span data-testid="has-getme">{typeof adapter.getMe}</span>
    </div>
  );
}

describe('HudProvider', () => {
  it('раздаёт адаптер и конфиг вниз по дереву', () => {
    render(
      <HudProvider
        adapter={makeFakeAdapter()}
        config={{ botUsername: 'test_bot', currency: 'GRAM', minBet: 0.1, maxBet: 100 }}
      >
        <Probe />
      </HudProvider>,
    );
    expect(screen.getByTestId('currency')).toHaveTextContent('GRAM');
    expect(screen.getByTestId('has-getme')).toHaveTextContent('function');
  });

  it('падает понятной ошибкой, если хук вызван вне провайдера', () => {
    // Гасим шум React про пойманную ошибку рендера.
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Probe />)).toThrow(/HudProvider/);
    spy.mockRestore();
  });
});
```

- [ ] **Step 3: Убедиться, что тест падает**

Run: `cd /Users/ivan/PhpStormProjects/game-hud && npx vitest run src/context/HudProvider.test.tsx`
Expected: FAIL — `Failed to resolve import "./HudProvider"`.

- [ ] **Step 4: Написать провайдер**

`L/src/context/HudProvider.tsx`:

```tsx
import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { HudAdapter, HudConfig } from '../adapter/types';

interface HudContextValue {
  adapter: HudAdapter;
  config: HudConfig;
}

const HudContext = createContext<HudContextValue | null>(null);

export function HudProvider({
  adapter,
  config,
  children,
}: {
  adapter: HudAdapter;
  config: HudConfig;
  children: ReactNode;
}) {
  const value = useMemo(() => ({ adapter, config }), [adapter, config]);
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
```

- [ ] **Step 5: Написать тестовый хелпер**

`L/src/test/renderWithHud.tsx`:

```tsx
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
```

Хелпер импортирует `../i18n/locales/en.json`, который появится в Task 9. Поэтому
Task 9 идёт раньше всех экранов кабинета, а тест провайдера из шага 2 словарей не
требует и проходит уже сейчас.

- [ ] **Step 6: Прогнать тест провайдера**

Run: `cd /Users/ivan/PhpStormProjects/game-hud && npx vitest run src/context/HudProvider.test.tsx`
Expected: 2 passed.

- [ ] **Step 7: Коммит**

```bash
cd /Users/ivan/PhpStormProjects/game-hud
git add src/context/ src/test/
git commit -m "feat(context): HudProvider, хуки доступа и тестовый хелпер"
```

---

### Task 5: Загрузка данных через адаптер

**Files:**
- Create: `L/src/context/useHudResource.ts`, `L/src/context/useHudResource.test.tsx`

- [ ] **Step 1: Написать падающий тест**

`L/src/context/useHudResource.test.tsx`:

```tsx
import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { HudProvider } from './HudProvider';
import { useHudResource } from './useHudResource';
import { makeFakeAdapter } from '../test/fakeAdapter';
import type { HudAdapter } from '../adapter/types';

function wrapper(adapter: HudAdapter) {
  return ({ children }: { children: ReactNode }) => (
    <HudProvider
      adapter={adapter}
      config={{ botUsername: 'test_bot', currency: 'GRAM', minBet: 0.1, maxBet: 100 }}
    >
      {children}
    </HudProvider>
  );
}

describe('useHudResource', () => {
  it('отдаёт loading, потом данные', async () => {
    const adapter = makeFakeAdapter();
    const { result } = renderHook(() => useHudResource('me', (a) => a.getMe()), {
      wrapper: wrapper(adapter),
    });

    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeNull();

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data?.balance).toBe(12.5);
    expect(result.current.error).toBeNull();
  });

  it('кладёт текст ошибки в error и снимает loading', async () => {
    const adapter = makeFakeAdapter({
      getMe: vi.fn(async () => {
        throw new Error('boom');
      }) as never,
    });
    const { result } = renderHook(() => useHudResource('me', (a) => a.getMe()), {
      wrapper: wrapper(adapter),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('boom');
    expect(result.current.data).toBeNull();
  });

  it('reload перезапрашивает', async () => {
    const adapter = makeFakeAdapter();
    const { result } = renderHook(() => useHudResource('me', (a) => a.getMe()), {
      wrapper: wrapper(adapter),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(adapter.getMe).toHaveBeenCalledTimes(1);

    act(() => result.current.reload());
    await waitFor(() => expect(adapter.getMe).toHaveBeenCalledTimes(2));
  });

  it('не пишет состояние после размонтирования', async () => {
    let resolve: (v: unknown) => void = () => {};
    const adapter = makeFakeAdapter({
      getMe: vi.fn(
        () =>
          new Promise((r) => {
            resolve = r;
          }),
      ) as never,
    });
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { unmount } = renderHook(() => useHudResource('me', (a) => a.getMe()), {
      wrapper: wrapper(adapter),
    });
    unmount();
    await act(async () => {
      resolve({ balance: 1 });
    });
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it('перезапрашивает при смене ключа', async () => {
    const adapter = makeFakeAdapter();
    const { result, rerender } = renderHook(
      ({ w }: { w: string }) =>
        useHudResource(`lb:${w}`, (a) => a.getLeaderboard('profit', w as '7d')),
      { wrapper: wrapper(adapter), initialProps: { w: '7d' } },
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(adapter.getLeaderboard).toHaveBeenCalledTimes(1);

    rerender({ w: '30d' });
    await waitFor(() => expect(adapter.getLeaderboard).toHaveBeenCalledTimes(2));
  });
});
```

- [ ] **Step 2: Убедиться, что тест падает**

Run: `cd /Users/ivan/PhpStormProjects/game-hud && npx vitest run src/context/useHudResource.test.tsx`
Expected: FAIL — `Failed to resolve import "./useHudResource"`.

- [ ] **Step 3: Написать хук**

`L/src/context/useHudResource.ts`:

```ts
import { useCallback, useEffect, useRef, useState } from 'react';
import { useHudAdapter } from './HudProvider';
import type { HudAdapter } from '../adapter/types';

export interface HudResource<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

/**
 * Один запрос к адаптеру с состояниями загрузки и ошибки.
 *
 * `key` — строка, при смене которой запрос повторяется. Экраны с параметрами
 * (лидерборд) кладут параметры в ключ: `lb:profit:7d`.
 */
export function useHudResource<T>(
  key: string,
  fetcher: (adapter: HudAdapter) => Promise<T>,
): HudResource<T> {
  const adapter = useHudAdapter();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  // fetcher пересоздаётся на каждый рендер вызывающего компонента, поэтому в
  // зависимостях эффекта его нет — иначе запрос уходил бы бесконечно. Держим
  // последнюю версию в ref, а перезапрос определяют только key и tick.
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetcherRef
      .current(adapter)
      .then((d) => {
        if (cancelled) return;
        setData(d);
        setError(null);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : String(e));
        setData(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [adapter, key, tick]);

  return { data, loading, error, reload: useCallback(() => setTick((t) => t + 1), []) };
}
```

- [ ] **Step 4: Прогнать тесты**

Run: `cd /Users/ivan/PhpStormProjects/game-hud && npx vitest run src/context/useHudResource.test.tsx`
Expected: 5 passed.

- [ ] **Step 5: Коммит**

```bash
cd /Users/ivan/PhpStormProjects/game-hud
git add src/context/useHudResource.ts src/context/useHudResource.test.tsx
git commit -m "feat(context): useHudResource — загрузка, ошибка, повтор"
```

---

# Часть B. База UI

### Task 6: Safe-area для двух режимов вьюпорта

**Files:**
- Create: `L/src/theme/useTelegramSafeArea.ts`, `L/src/theme/useTelegramSafeArea.test.tsx`, `L/src/types/telegram.d.ts`

- [ ] **Step 1: Написать падающий тест**

`L/src/theme/useTelegramSafeArea.test.tsx`:

```tsx
import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useTelegramSafeArea } from './useTelegramSafeArea';

function setTg(over: Record<string, unknown>) {
  Object.assign(window.Telegram!.WebApp as unknown as Record<string, unknown>, over);
}

function readVar(name: string) {
  return document.documentElement.style.getPropertyValue(name);
}

describe('useTelegramSafeArea', () => {
  beforeEach(() => {
    document.documentElement.style.cssText = '';
    setTg({
      safeAreaInset: { top: 0, right: 0, bottom: 0, left: 0 },
      contentSafeAreaInset: { top: 0, right: 0, bottom: 0, left: 0 },
      isFullscreen: false,
    });
  });

  it('пишет переменные из инсетов Telegram', () => {
    setTg({
      safeAreaInset: { top: 20, right: 2, bottom: 10, left: 3 },
      contentSafeAreaInset: { top: 30, right: 0, bottom: 0, left: 0 },
    });
    renderHook(() => useTelegramSafeArea());
    expect(readVar('--hud-safe-top')).toBe('50px');
    expect(readVar('--hud-safe-bottom')).toBe('10px');
    expect(readVar('--hud-safe-left')).toBe('3px');
    expect(readVar('--hud-safe-right')).toBe('2px');
  });

  it('в фуллскрине подставляет минимум сверху, когда Telegram отдаёт нули', () => {
    // Telegram сообщает top=0, хотя его собственный хром висит над вьюпортом.
    setTg({ isFullscreen: true });
    renderHook(() => useTelegramSafeArea());
    expect(readVar('--hud-safe-top')).toBe('88px');
    expect(readVar('--hud-safe-bottom')).toBe('24px');
  });

  it('делит инсеты на масштаб сцены, если он задан', () => {
    // matreshka и basketball держат #stage 390x844 с transform: scale().
    document.documentElement.style.setProperty('--stage-scale-num', '0.5');
    setTg({ safeAreaInset: { top: 20, right: 0, bottom: 8, left: 0 } });
    renderHook(() => useTelegramSafeArea({ scaleVar: '--stage-scale-num' }));
    expect(readVar('--hud-safe-top')).toBe('40px');
    expect(readVar('--hud-safe-bottom')).toBe('16px');
  });

  it('не падает вне Telegram и обнуляет переменные', () => {
    const saved = window.Telegram;
    // @ts-expect-error — проверяем поведение в обычном браузере
    window.Telegram = undefined;
    renderHook(() => useTelegramSafeArea());
    expect(readVar('--hud-safe-top')).toBe('0px');
    window.Telegram = saved;
  });
});
```

- [ ] **Step 2: Убедиться, что тест падает**

Run: `cd /Users/ivan/PhpStormProjects/game-hud && npx vitest run src/theme/useTelegramSafeArea.test.tsx`
Expected: FAIL — `Failed to resolve import "./useTelegramSafeArea"`.

- [ ] **Step 3: Написать хук**

`L/src/theme/useTelegramSafeArea.ts`:

```ts
import { useEffect } from 'react';

/**
 * В фуллскрине Telegram рисует свой хром (крестик, «…», меню) поверх вьюпорта,
 * но на большинстве клиентов всё равно отдаёт safeAreaInset.top = 0. Без этого
 * минимума шапка кабинета уезжает под кнопки.
 */
const FULLSCREEN_TOP_FALLBACK = 88;
const FULLSCREEN_BOTTOM_FALLBACK = 24;

interface Inset {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

const ZERO: Inset = { top: 0, right: 0, bottom: 0, left: 0 };

/**
 * Пишет `--hud-safe-top/right/bottom/left` в корень документа.
 *
 * `scaleVar` — имя CSS-переменной с числовым масштабом сцены. Игры с
 * фиксированным `#stage` и `transform: scale()` (matreshka, basketball)
 * передают её, чтобы инсеты в экранных пикселях пересчитались в единицы холста.
 * Играм во весь вьюпорт (fatman, crash-race, molot) параметр не нужен.
 */
export function useTelegramSafeArea(opts: { scaleVar?: string } = {}): void {
  const { scaleVar } = opts;

  useEffect(() => {
    const root = document.documentElement;

    const apply = () => {
      const tg = window.Telegram?.WebApp;

      if (!tg) {
        for (const side of ['top', 'right', 'bottom', 'left'] as const) {
          root.style.setProperty(`--hud-safe-${side}`, '0px');
        }
        return;
      }

      const scale = scaleVar
        ? Number.parseFloat(getComputedStyle(root).getPropertyValue(scaleVar)) || 1
        : 1;

      const s: Inset = tg.safeAreaInset ?? ZERO;
      const c: Inset = tg.contentSafeAreaInset ?? ZERO;
      const fullscreen = tg.isFullscreen === true;

      const top = fullscreen ? Math.max(s.top + c.top, FULLSCREEN_TOP_FALLBACK) : s.top + c.top;
      const bottom = fullscreen
        ? Math.max(s.bottom + c.bottom, FULLSCREEN_BOTTOM_FALLBACK)
        : s.bottom + c.bottom;

      root.style.setProperty('--hud-safe-top', `${top / scale}px`);
      root.style.setProperty('--hud-safe-right', `${(s.right + c.right) / scale}px`);
      root.style.setProperty('--hud-safe-bottom', `${bottom / scale}px`);
      root.style.setProperty('--hud-safe-left', `${(s.left + c.left) / scale}px`);
      root.classList.toggle('hud-tg-fullscreen', fullscreen);
    };

    apply();

    const tg = window.Telegram?.WebApp;
    tg?.onEvent?.('safeAreaChanged', apply);
    tg?.onEvent?.('contentSafeAreaChanged', apply);
    tg?.onEvent?.('fullscreenChanged', apply);
    return () => {
      tg?.offEvent?.('safeAreaChanged', apply);
      tg?.offEvent?.('contentSafeAreaChanged', apply);
      tg?.offEvent?.('fullscreenChanged', apply);
    };
  }, [scaleVar]);
}
```

- [ ] **Step 4: Добавить типы Telegram**

`L/src/types/telegram.d.ts` — взять за основу `F/types/telegram.ts` и оставить только
то, что читает библиотека:

```ts
interface TelegramInset {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

interface TelegramWebApp {
  initDataUnsafe: {
    user?: {
      id: number;
      first_name?: string;
      last_name?: string;
      username?: string;
      language_code?: string;
      photo_url?: string;
    };
  };
  BackButton?: {
    show: () => void;
    hide: () => void;
    onClick: (cb: () => void) => void;
    offClick: (cb: () => void) => void;
  };
  HapticFeedback?: {
    impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
  };
  safeAreaInset?: TelegramInset;
  contentSafeAreaInset?: TelegramInset;
  isFullscreen?: boolean;
  onEvent?: (event: string, cb: () => void) => void;
  offEvent?: (event: string, cb: () => void) => void;
  ready?: () => void;
  expand?: () => void;
  openTelegramLink?: (url: string) => void;
}

interface Window {
  Telegram?: { WebApp: TelegramWebApp };
}
```

Игровые методы (`requestFullscreen`, `disableVerticalSwipes`,
`enableClosingConfirmation`) не переносить — ими управляет игра, не библиотека.

- [ ] **Step 5: Прогнать тесты**

Run: `cd /Users/ivan/PhpStormProjects/game-hud && npx vitest run src/theme/`
Expected: 4 passed.

- [ ] **Step 6: Коммит**

```bash
cd /Users/ivan/PhpStormProjects/game-hud
git add src/theme/ src/types/
git commit -m "feat(theme): safe-area Telegram для scaled и полноэкранного режимов"
```

---

### Task 7: Единая тема

**Files:**
- Create: `L/src/theme/styles.css`
- Read: `F/styles/global.css`, `F/styles/profile.css`, `F/styles/additions.css`, `M/profile/profile.css`

- [ ] **Step 1: Собрать таблицу стилей**

Сложить в `L/src/theme/styles.css` в этом порядке:

1. Блок `:root` с токенами JUBB — значения из `F/styles/global.css:7-28`, имена с
   префиксом: `--bg-0` → `--hud-bg-0`, `--ink` → `--hud-ink`, `--coral` → `--hud-coral`,
   `--display` → `--hud-display` и так далее. Плюс фолбэки safe-area:
   ```css
   :root {
     --hud-safe-top: 0px;
     --hud-safe-right: 0px;
     --hud-safe-bottom: 0px;
     --hud-safe-left: 0px;
   }
   ```
2. Целиком `F/styles/profile.css` (626 строк) с применённым правилом T4 ко всем
   селекторам и с заменой ссылок на токены (`var(--coral)` → `var(--hud-coral)`).
3. Из `F/styles/global.css` — только правила HUD: `.balance-chip`, `.profile-avatar-btn`,
   `.brand-row`, `.logo-img`, `.sound-settings*`, `.bet-*`, `.sheet*`, `.modal*`.
   Правила игровой сцены (`.app-shell`, `.phone-wrap`, `.phone`, `.game`, `.diver`,
   `.pool*`, `.splash*`, `.scene*`, `.shake-*`, `.hud`, `.multiplier`) **не переносить** —
   они остаются в fatman.
4. Из `M/profile/profile.css:304-330` — правила промо-карусели `.profile-promos`
   и `.profile-promo*`, тоже с префиксом.

Блок scoped-фолбэков `.profile-overlay { --bg-0: var(--bg, ...) }` из начала
`M/profile/profile.css` **не переносить** — он существовал только чтобы перекрасить
кабинет под matreshka, а тема теперь единая.

- [ ] **Step 2: Проверить, что не осталось непрефиксованных классов**

Run:
```bash
cd /Users/ivan/PhpStormProjects/game-hud && \
  grep -oE '^\s*\.[a-zA-Z][a-zA-Z0-9_-]*' src/theme/styles.css | grep -v '\.hud-' | sort -u
```
Expected: пустой вывод.

- [ ] **Step 3: Проверить, что не осталось ссылок на старые токены**

Run:
```bash
cd /Users/ivan/PhpStormProjects/game-hud && \
  grep -oE 'var\(--[a-z0-9-]+' src/theme/styles.css | grep -v 'var(--hud-' | sort -u
```
Expected: пустой вывод.

- [ ] **Step 4: Коммит**

```bash
cd /Users/ivan/PhpStormProjects/game-hud
git add src/theme/styles.css
git commit -m "feat(theme): единая тема JUBB с префиксом hud-"
```

---

### Task 8: Иконки и примитивы

**Files:**
- Create: `L/src/primitives/icons.tsx`, `L/src/primitives/InfoPopover.tsx`, `L/src/primitives/BottomSheet.tsx`, `L/src/primitives/Skeleton.tsx`, `L/src/primitives/Skeleton.test.tsx`
- Modify: `L/src/theme/styles.css`
- Read: `F/components/profile/icons.tsx` (127 строк), `M/profile/icons.tsx` (140), `F/components/profile/InfoPopover.tsx` (85), `F/components/WalletSheet.tsx:1-40`

- [ ] **Step 1: Объединить иконки**

Скопировать `F/components/profile/icons.tsx` в `L/src/primitives/icons.tsx`, затем
добавить иконки, которые есть в `M/profile/icons.tsx`, но отсутствуют у fatman.
Найти недостающие:

```bash
cd /Users/ivan/PhpStormProjects && \
  comm -13 \
    <(grep -oE 'export (const|function) Icon[A-Za-z]+' fatman/frontend/src/components/profile/icons.tsx | grep -oE 'Icon[A-Za-z]+' | sort) \
    <(grep -oE 'export (const|function) Icon[A-Za-z]+' matreshka/frontend/src/profile/icons.tsx | grep -oE 'Icon[A-Za-z]+' | sort)
```

Каждую из выведенных иконок скопировать из matreshka в конец файла библиотеки.
Применить T4 к `className` внутри SVG.

- [ ] **Step 2: Перенести InfoPopover и написать BottomSheet**

`L/src/primitives/InfoPopover.tsx` — копия `F/components/profile/InfoPopover.tsx`
с правилами T4, T7.

`L/src/primitives/BottomSheet.tsx` — общая обвязка боттом-шита, выделенная из
`F/components/WalletSheet.tsx:1-40`:

```tsx
import { useEffect, type ReactNode } from 'react';

export function BottomSheet({
  open,
  onClose,
  children,
  labelledBy,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  labelledBy?: string;
}) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="hud-sheet-backdrop" onPointerDown={onClose}>
      <div
        className="hud-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Написать падающий тест скелетона**

`L/src/primitives/Skeleton.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Skeleton } from './Skeleton';

describe('Skeleton', () => {
  it('рисует заданное число строк', () => {
    render(<Skeleton rows={3} />);
    expect(screen.getAllByTestId('hud-skeleton-row')).toHaveLength(3);
  });

  it('помечен для скринридера как «идёт загрузка»', () => {
    render(<Skeleton rows={1} />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true');
  });
});
```

- [ ] **Step 4: Убедиться, что тест падает**

Run: `cd /Users/ivan/PhpStormProjects/game-hud && npx vitest run src/primitives/Skeleton.test.tsx`
Expected: FAIL — `Failed to resolve import "./Skeleton"`.

- [ ] **Step 5: Написать Skeleton и его стили**

`L/src/primitives/Skeleton.tsx`:

```tsx
export function Skeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="hud-skeleton" role="status" aria-busy="true">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="hud-skeleton__row" data-testid="hud-skeleton-row" />
      ))}
    </div>
  );
}
```

Дописать в конец `L/src/theme/styles.css`:

```css
.hud-skeleton { display: flex; flex-direction: column; gap: 10px; padding: 12px 0; }
.hud-skeleton__row {
  height: 44px;
  border-radius: 12px;
  background: linear-gradient(
    90deg,
    rgba(244, 241, 234, 0.05) 25%,
    rgba(244, 241, 234, 0.10) 37%,
    rgba(244, 241, 234, 0.05) 63%
  );
  background-size: 400% 100%;
  animation: hud-skeleton-shimmer 1.3s ease-in-out infinite;
}
@keyframes hud-skeleton-shimmer {
  0% { background-position: 100% 50%; }
  100% { background-position: 0 50%; }
}
.hud-profile-error { padding: 16px; color: var(--hud-danger); font-family: var(--hud-sans); }
```

- [ ] **Step 6: Прогнать тесты**

Run: `cd /Users/ivan/PhpStormProjects/game-hud && npx vitest run src/primitives/`
Expected: 2 passed.

- [ ] **Step 7: Коммит**

```bash
cd /Users/ivan/PhpStormProjects/game-hud
git add src/primitives/ src/theme/styles.css
git commit -m "feat(primitives): иконки, боттом-шит, popover, скелетон"
```

---

# Часть C. i18n

### Task 9: Словари библиотеки

**Files:**
- Create: `L/src/i18n/index.ts`, `L/src/i18n/locales/{en,ru,es,de,fr,hi,ur,bn,si,ne}.json`, `L/src/i18n/locales.test.ts`
- Read: `F/i18n/locales/*.json`, `M/i18n/locales/*.json`

- [ ] **Step 1: Отфильтровать словари**

Для каждого из 10 языков взять `F/i18n/locales/<lang>.json` и оставить только
неймспейсы библиотеки. Игровые (`sound`, `app`, `round`, `bet`, `result`, `tweaks`)
выбросить.

```bash
cd /Users/ivan/PhpStormProjects/game-hud && mkdir -p src/i18n/locales && \
for l in en ru es de fr hi ur bn si ne; do
  node -e "
    const fs = require('node:fs');
    const src = JSON.parse(fs.readFileSync('/Users/ivan/PhpStormProjects/fatman/frontend/src/i18n/locales/$l.json', 'utf8'));
    const keep = ['common','profile','wallet','history','stats','leaderboard','referrals','notifications','language','support'];
    const out = {};
    for (const k of keep) if (src[k]) out[k] = src[k];
    fs.writeFileSync('src/i18n/locales/$l.json', JSON.stringify(out, null, 2) + '\n');
  "
done && ls -1 src/i18n/locales/ | wc -l
```
Expected: `10`.

- [ ] **Step 2: Написать точку входа**

`L/src/i18n/index.ts`:

```ts
import en from './locales/en.json';
import ru from './locales/ru.json';
import es from './locales/es.json';
import de from './locales/de.json';
import fr from './locales/fr.json';
import hi from './locales/hi.json';
import ur from './locales/ur.json';
import bn from './locales/bn.json';
import si from './locales/si.json';
import ne from './locales/ne.json';

export const SUPPORTED_LANGUAGES = [
  'en',
  'ru',
  'es',
  'de',
  'fr',
  'hi',
  'ur',
  'bn',
  'si',
  'ne',
] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

/** Языки с письмом справа налево — игра выставляет по ним dir на <html>. */
export const RTL_LANGUAGES: ReadonlySet<string> = new Set(['ur', 'ar', 'fa', 'he']);

/**
 * Словари библиотеки. Игра сливает их со своими при инициализации i18next,
 * причём свои кладёт вторыми, чтобы перекрывать при совпадении ключа:
 *
 *   resources: { en: { translation: { ...hudLocales.en, ...gameEn } } }
 */
export const hudLocales = { en, ru, es, de, fr, hi, ur, bn, si, ne } as const;
```

- [ ] **Step 3: Написать тест паритета ключей**

`L/src/i18n/locales.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { hudLocales, SUPPORTED_LANGUAGES } from './index';

function flatKeys(obj: unknown, prefix = ''): string[] {
  if (obj === null || typeof obj !== 'object') return [prefix];
  return Object.entries(obj as Record<string, unknown>).flatMap(([k, v]) =>
    flatKeys(v, prefix ? `${prefix}.${k}` : k),
  );
}

const HUD_NAMESPACES = [
  'common',
  'profile',
  'wallet',
  'history',
  'stats',
  'leaderboard',
  'referrals',
  'notifications',
  'language',
  'support',
];

describe('словари библиотеки', () => {
  it('есть на всех десяти языках', () => {
    expect(Object.keys(hudLocales).sort()).toEqual([...SUPPORTED_LANGUAGES].sort());
  });

  it('содержат только неймспейсы библиотеки, без игровых', () => {
    for (const [lang, dict] of Object.entries(hudLocales)) {
      const extra = Object.keys(dict).filter((k) => !HUD_NAMESPACES.includes(k));
      expect(extra, `лишние неймспейсы в ${lang}`).toEqual([]);
    }
  });

  it('каждый язык покрывает все ключи английского', () => {
    const base = flatKeys(hudLocales.en);
    for (const [lang, dict] of Object.entries(hudLocales)) {
      const has = new Set(flatKeys(dict));
      const missing = base.filter((k) => !has.has(k));
      expect(missing, `не переведено в ${lang}`).toEqual([]);
    }
  });

  it('ключ profile.title на месте — по нему провайдер проверяет подмешивание', () => {
    expect(hudLocales.en.profile).toHaveProperty('title');
  });
});
```

- [ ] **Step 4: Прогнать тест**

Run: `cd /Users/ivan/PhpStormProjects/game-hud && npx vitest run src/i18n/`
Expected: 4 passed.

Если третий тест падает — в исходных словарях fatman есть дырки. Для каждого
недостающего ключа взять формулировку из `M/i18n/locales/<lang>.json`; если и там
нет — скопировать английский текст и добавить строку в
`L/src/i18n/locales/UNTRANSLATED.md` со списком языков и ключей, чтобы перевод
не потерялся.

- [ ] **Step 5: Коммит**

```bash
cd /Users/ivan/PhpStormProjects/game-hud
git add src/i18n/
git commit -m "feat(i18n): словари общих неймспейсов на 10 языках"
```

---

# Часть D. Кабинет

Общий порядок для каждой задачи этой части: скопировать исходный файл, применить
правила T1–T7 и перечисленные в задаче конкретные замены, написать тест, прогнать.

### Task 10: Каркас кабинета

**Files:**
- Create: `L/src/profile/ProfileShell.tsx`, `L/src/profile/ProfileShell.test.tsx`, `L/src/profile/LegalFooter.tsx`
- Read: `F/components/profile/ProfileShell.tsx` (96 строк), `F/components/profile/LegalFooter.tsx` (20)

- [ ] **Step 1: Написать падающий тест**

`L/src/profile/ProfileShell.test.tsx`:

```tsx
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProfileShell } from './ProfileShell';
import { useHudStore } from '../store/hudStore';
import { renderWithHud } from '../test/renderWithHud';

vi.mock('@tonconnect/ui-react', () => ({
  useTonAddress: () => '',
  useTonConnectUI: () => [{ openModal: vi.fn(), sendTransaction: vi.fn() }],
  TonConnectButton: () => null,
}));

describe('ProfileShell', () => {
  beforeEach(() => {
    useHudStore.setState({ open: false, screen: 'hub', walletFocus: null, helpTheme: null });
  });

  it('закрытый оверлей ничего не рендерит', () => {
    const { container } = renderWithHud(<ProfileShell />);
    expect(container).toBeEmptyDOMElement();
  });

  it('открытый показывает хаб', async () => {
    useHudStore.setState({ open: true, screen: 'hub' });
    renderWithHud(<ProfileShell />);
    await waitFor(() => expect(screen.getByText('Test')).toBeInTheDocument());
  });

  it('с внутреннего экрана кнопка ведёт назад на хаб, а не закрывает', async () => {
    useHudStore.setState({ open: true, screen: 'stats' });
    renderWithHud(<ProfileShell />);
    await userEvent.click(screen.getByRole('button', { name: /back/i }));
    expect(useHudStore.getState()).toMatchObject({ open: true, screen: 'hub' });
  });

  it('с хаба кнопка закрывает оверлей', async () => {
    useHudStore.setState({ open: true, screen: 'hub' });
    renderWithHud(<ProfileShell />);
    await userEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(useHudStore.getState().open).toBe(false);
  });

  it('показывает и прячет Telegram BackButton вместе с оверлеем', () => {
    const show = vi.fn();
    const hide = vi.fn();
    Object.assign(window.Telegram!.WebApp.BackButton!, {
      show,
      hide,
      onClick: vi.fn(),
      offClick: vi.fn(),
    });
    useHudStore.setState({ open: true, screen: 'hub' });
    const { unmount } = renderWithHud(<ProfileShell />);
    expect(show).toHaveBeenCalled();
    unmount();
    expect(hide).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Убедиться, что тест падает**

Run: `cd /Users/ivan/PhpStormProjects/game-hud && npx vitest run src/profile/ProfileShell.test.tsx`
Expected: FAIL — `Failed to resolve import "./ProfileShell"`.

- [ ] **Step 3: Перенести LegalFooter и ProfileShell**

`L/src/profile/LegalFooter.tsx` — копия `F/components/profile/LegalFooter.tsx` с T2, T4.

`L/src/profile/ProfileShell.tsx` — копия `F/components/profile/ProfileShell.tsx`,
плюс к правилам T2, T4, T7:

- `ProfileScreen` → `HudScreen`, импорт из `../store/hudStore`
- `useProfileStore` → `useHudStore`
- импорты экранов остаются относительными (`./ProfileHub` и так далее)
- `IconArrowLeft`, `IconClose` — из `../primitives/icons`
- `aria-label` кнопки шапки остаются `common.close` и `common.back` — по ним и
  находит тест, отдельные `data-testid` не нужны

Экраны, которых ещё нет (всё кроме `ProfileHub`), временно отрендерить как `null`:
в шаге 3 каждой следующей задачи части D соответствующая строка заменяется на
реальный компонент.

- [ ] **Step 4: Прогнать тест**

Run: `cd /Users/ivan/PhpStormProjects/game-hud && npx vitest run src/profile/ProfileShell.test.tsx`
Expected: 5 passed. Тест «открытый показывает хаб» требует `ProfileHub` из Task 11 —
до него он будет падать; выполнить Task 11 сразу за этим и прогнать снова.

- [ ] **Step 5: Коммит**

```bash
cd /Users/ivan/PhpStormProjects/game-hud
git add src/profile/
git commit -m "feat(profile): каркас кабинета с навигацией и BackButton"
```

---

### Task 11: Хаб кабинета

**Files:**
- Create: `L/src/profile/ProfileHub.tsx`, `L/src/profile/ProfileHub.test.tsx`
- Modify: `L/src/profile/ProfileShell.tsx`
- Read: `F/components/profile/ProfileHub.tsx` (144 строки), `M/profile/ProfileHub.tsx` (149)

- [ ] **Step 1: Написать падающий тест**

`L/src/profile/ProfileHub.test.tsx`:

```tsx
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProfileHub } from './ProfileHub';
import { useHudStore } from '../store/hudStore';
import { renderWithHud } from '../test/renderWithHud';
import { makeFailingAdapter } from '../test/fakeAdapter';

vi.mock('@tonconnect/ui-react', () => ({
  useTonAddress: () => '',
  useTonConnectUI: () => [{ openModal: vi.fn(), sendTransaction: vi.fn() }],
  TonConnectButton: () => null,
}));

describe('ProfileHub', () => {
  beforeEach(() => {
    useHudStore.setState({ open: true, screen: 'hub', walletFocus: null, helpTheme: null });
  });

  it('показывает имя и три баланса через единый форматтер', async () => {
    renderWithHud(<ProfileHub />);
    await waitFor(() => expect(screen.getByText('Test')).toBeInTheDocument());
    expect(screen.getByText('12.50')).toBeInTheDocument();
    expect(screen.getByText('3.00')).toBeInTheDocument();
    expect(screen.getByText('1.25')).toBeInTheDocument();
  });

  it('пункт меню уводит на нужный экран', async () => {
    renderWithHud(<ProfileHub />);
    await waitFor(() => expect(screen.getByText('Test')).toBeInTheDocument());
    await userEvent.click(screen.getByText(/statistic/i));
    expect(useHudStore.getState().screen).toBe('stats');
  });

  it('без подключённого кошелька строка кошелька говорит «не подключён»', async () => {
    // useTonAddress замокан пустой строкой — подсказка должна читать его,
    // а не серверное me.walletAddress, которое всегда пустое.
    renderWithHud(<ProfileHub />);
    await waitFor(() => expect(screen.getByText(/not connected/i)).toBeInTheDocument());
  });

  it('переживает падение адаптера и не роняет экран', async () => {
    renderWithHud(<ProfileHub />, { adapter: makeFailingAdapter() });
    await waitFor(() => expect(screen.getAllByText('0.00').length).toBeGreaterThan(0));
  });
});
```

- [ ] **Step 2: Убедиться, что тест падает**

Run: `cd /Users/ivan/PhpStormProjects/game-hud && npx vitest run src/profile/ProfileHub.test.tsx`
Expected: FAIL — `Failed to resolve import "./ProfileHub"`.

- [ ] **Step 3: Перенести хаб**

Взять `F/components/profile/ProfileHub.tsx` за основу. Применить T1–T7, плюс:

- `const me = useProfileMe().data` →
  `const { data: me } = useHudResource('me', (a) => a.getMe())`
- **улучшение из matreshka:** добавить `import { useTonAddress } from '@tonconnect/ui-react'`,
  завести `const walletAddress = useTonAddress()` и в подсказке строки кошелька
  использовать его вместо `me?.walletAddress` — серверное поле всегда пустое, потому
  что кошелёк подключается на клиенте:
  ```tsx
  hint: walletAddress ? t('profile.wallet_connected') : t('profile.wallet_not_connected'),
  ```
- T5: три `(me?.X ?? 0).toFixed(2)` → `fmtAmount(me?.X)`
- реф-ссылку брать из `me?.refLink`, не собирать на клиенте

- [ ] **Step 4: Вернуть рендер хаба в ProfileShell**

В `L/src/profile/ProfileShell.tsx` заменить заглушку на реальный импорт и рендер
`{screen === 'hub' && <ProfileHub />}`.

- [ ] **Step 5: Прогнать тесты**

Run: `cd /Users/ivan/PhpStormProjects/game-hud && npx vitest run src/profile/`
Expected: 9 passed (5 у ProfileShell, 4 у ProfileHub).

- [ ] **Step 6: Коммит**

```bash
cd /Users/ivan/PhpStormProjects/game-hud
git add src/profile/
git commit -m "feat(profile): хаб с живым адресом TonConnect"
```

---

### Task 12: Кошелёк

**Files:**
- Create: `L/src/profile/WalletScreen.tsx`, `L/src/profile/WalletScreen.test.tsx`
- Modify: `L/src/profile/ProfileShell.tsx`, `L/src/i18n/locales/*.json`
- Read: `F/components/profile/WalletScreen.tsx` (211 строк), `M/profile/WalletScreen.tsx:88-100`

- [ ] **Step 1: Написать падающий тест**

`L/src/profile/WalletScreen.test.tsx`:

```tsx
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WalletScreen } from './WalletScreen';
import { useHudStore } from '../store/hudStore';
import { renderWithHud } from '../test/renderWithHud';
import { makeFakeAdapter } from '../test/fakeAdapter';

vi.mock('@tonconnect/ui-react', () => ({
  useTonAddress: () => 'EQUserWallet',
  useTonConnectUI: () => [{ openModal: vi.fn(), sendTransaction: vi.fn() }],
  TonConnectButton: () => <button type="button">TonConnect</button>,
}));

describe('WalletScreen', () => {
  beforeEach(() => {
    useHudStore.setState({ open: true, screen: 'wallet', walletFocus: null, helpTheme: null });
  });

  it('показывает промо-карусель', async () => {
    const { container } = renderWithHud(<WalletScreen />);
    await waitFor(() => expect(container.querySelector('.hud-profile-promos')).toBeInTheDocument());
  });

  it('отправляет вывод с суммой и адресом', async () => {
    const adapter = makeFakeAdapter();
    renderWithHud(<WalletScreen />, { adapter });
    const input = await screen.findByPlaceholderText(/amount/i);
    await userEvent.type(input, '5');
    await userEvent.click(screen.getByRole('button', { name: /withdraw/i }));
    await waitFor(() => expect(adapter.postWithdraw).toHaveBeenCalledWith(5, 'EQUserWallet'));
  });

  it('не даёт вывести больше баланса', async () => {
    const adapter = makeFakeAdapter();
    renderWithHud(<WalletScreen />, { adapter });
    const input = await screen.findByPlaceholderText(/amount/i);
    await userEvent.type(input, '999');
    await userEvent.click(screen.getByRole('button', { name: /withdraw/i }));
    expect(adapter.postWithdraw).not.toHaveBeenCalled();
  });

  it('прячет список выводов, если адаптер его не умеет', async () => {
    const { container } = renderWithHud(<WalletScreen />, { adapter: makeFakeAdapter() });
    await waitFor(() => expect(screen.getByText(/EQTestAddress/)).toBeInTheDocument());
    expect(container.querySelector('.hud-wallet-withdrawals')).not.toBeInTheDocument();
  });

  it('показывает список выводов, когда метод есть', async () => {
    const adapter = makeFakeAdapter({
      getWithdrawals: vi.fn(async () => [
        {
          id: 'w1',
          amount: 2,
          status: 'pending',
          address: 'EQx',
          createdAt: '2026-07-20T09:00:00.000Z',
        },
      ]),
    });
    const { container } = renderWithHud(<WalletScreen />, { adapter });
    await waitFor(() =>
      expect(container.querySelector('.hud-wallet-withdrawals')).toBeInTheDocument(),
    );
  });
});
```

- [ ] **Step 2: Убедиться, что тест падает**

Run: `cd /Users/ivan/PhpStormProjects/game-hud && npx vitest run src/profile/WalletScreen.test.tsx`
Expected: FAIL — `Failed to resolve import "./WalletScreen"`.

- [ ] **Step 3: Добавить ключи промо-баннера в словари**

Ключи `wallet.promo_title` и `wallet.bonus_note` есть у matreshka, но не у fatman:

```bash
cd /Users/ivan/PhpStormProjects/game-hud && \
for l in en ru es de fr hi ur bn si ne; do
  node -e "
    const fs = require('node:fs');
    const dst = JSON.parse(fs.readFileSync('src/i18n/locales/$l.json', 'utf8'));
    const src = JSON.parse(fs.readFileSync('/Users/ivan/PhpStormProjects/matreshka/frontend/src/i18n/locales/$l.json', 'utf8'));
    for (const k of ['promo_title', 'bonus_note']) {
      if (dst.wallet[k] == null && src.wallet?.[k] != null) dst.wallet[k] = src.wallet[k];
    }
    fs.writeFileSync('src/i18n/locales/$l.json', JSON.stringify(dst, null, 2) + '\n');
  "
done && npx vitest run src/i18n/
```
Expected: тесты словарей зелёные — значит ключи легли во все 10 языков.

- [ ] **Step 4: Перенести экран**

Взять `F/components/profile/WalletScreen.tsx`. Применить T1–T7, плюс:

- `api.getDeposit(token)` → `adapter.getDeposit()`
- `api.postWalletLink(token, address)` → блок рендерить только при
  `typeof adapter.postWalletLink === 'function'`, вызывать `adapter.postWalletLink(address)`
- `api.postWithdraw(token, ton)` → `adapter.postWithdraw(ton, address || null)`,
  где `address` — значение `useTonAddress()`
- добавить блок выводов: если `adapter.getWithdrawals` есть, тянуть через
  `useHudResource('withdrawals', (a) => a.getWithdrawals!())` и рисовать список в
  `<div className="hud-wallet-withdrawals">`; если метода нет — блок не рендерить
- **улучшение из matreshka:** вставить промо-карусель из `M/profile/WalletScreen.tsx:90-97`
  сразу после заголовка:
  ```tsx
  <div className="hud-profile-promos">
    <div className="hud-profile-promo">
      <div className="hud-profile-promo__title">{t('wallet.promo_title')}</div>
      <div className="hud-profile-promo__sub">{t('wallet.bonus_note')}</div>
    </div>
  </div>
  ```
- `walletFocus` из стора по-прежнему скроллит к нужному блоку и вызывает
  `clearWalletFocus()` после применения

В `ProfileShell.tsx` заменить заглушку на `{screen === 'wallet' && <WalletScreen />}`.

- [ ] **Step 5: Прогнать тесты**

Run: `cd /Users/ivan/PhpStormProjects/game-hud && npx vitest run src/profile/WalletScreen.test.tsx`
Expected: 5 passed.

- [ ] **Step 6: Коммит**

```bash
cd /Users/ivan/PhpStormProjects/game-hud
git add src/profile/ src/i18n/locales/
git commit -m "feat(profile): кошелёк с промо-каруселью и опциональным списком выводов"
```

---

### Task 13: История транзакций

**Files:**
- Create: `L/src/profile/HistoryScreen.tsx`, `L/src/profile/HistoryScreen.test.tsx`
- Modify: `L/src/profile/ProfileShell.tsx`, `L/src/i18n/locales/*.json`
- Read: `F/components/profile/HistoryScreen.tsx` (118 строк)

- [ ] **Step 1: Написать падающий тест**

`L/src/profile/HistoryScreen.test.tsx`:

```tsx
import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { HistoryScreen } from './HistoryScreen';
import { renderWithHud } from '../test/renderWithHud';
import { makeFakeAdapter, makeFailingAdapter, FAKE_TX } from '../test/fakeAdapter';

describe('HistoryScreen', () => {
  it('показывает первую страницу транзакций', async () => {
    renderWithHud(<HistoryScreen />);
    await waitFor(() => expect(screen.getByText(/5\.00/)).toBeInTheDocument());
  });

  it('запрашивает первую страницу без курсора', async () => {
    const adapter = makeFakeAdapter();
    renderWithHud(<HistoryScreen />, { adapter });
    await waitFor(() => expect(adapter.getTransactions).toHaveBeenCalledWith(undefined));
  });

  it('не тянет следующую страницу, когда nextCursor пустой', async () => {
    const adapter = makeFakeAdapter();
    renderWithHud(<HistoryScreen />, { adapter });
    await waitFor(() => expect(adapter.getTransactions).toHaveBeenCalledTimes(1));
    await new Promise((r) => setTimeout(r, 60));
    expect(adapter.getTransactions).toHaveBeenCalledTimes(1);
  });

  it('показывает пустое состояние, когда транзакций нет', async () => {
    const adapter = makeFakeAdapter({
      getTransactions: vi.fn(async () => ({ items: [], nextCursor: null })),
    });
    renderWithHud(<HistoryScreen />, { adapter });
    await waitFor(() => expect(screen.getByText(/no operations/i)).toBeInTheDocument());
  });

  it('показывает ошибку, а не пустой экран', async () => {
    renderWithHud(<HistoryScreen />, { adapter: makeFailingAdapter('network down') });
    await waitFor(() => expect(screen.getByText(/network down/i)).toBeInTheDocument());
  });

  it('переводит вид операции по ключу history.kind.*', async () => {
    const adapter = makeFakeAdapter({
      getTransactions: vi.fn(async () => ({
        items: [{ ...FAKE_TX, kind: 'withdraw' }],
        nextCursor: null,
      })),
    });
    renderWithHud(<HistoryScreen />, { adapter });
    await waitFor(() => expect(screen.getByText(/5\.00/)).toBeInTheDocument());
    expect(screen.queryByText('withdraw')).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Убедиться, что тест падает**

Run: `cd /Users/ivan/PhpStormProjects/game-hud && npx vitest run src/profile/HistoryScreen.test.tsx`
Expected: FAIL — `Failed to resolve import "./HistoryScreen"`.

- [ ] **Step 3: Добавить ключ пустого состояния**

Проверить, есть ли `history.empty` в словарях, и при отсутствии добавить:

```bash
cd /Users/ivan/PhpStormProjects/game-hud && \
  node -e "console.log(JSON.parse(require('node:fs').readFileSync('src/i18n/locales/en.json','utf8')).history)"
```

Если ключа `empty` нет — добавить во все 10 языков тем же приёмом, что в Task 12
шаг 3, взяв формулировку из `M/i18n/locales/<lang>.json` (`history.empty`).
Английский текст должен содержать «No operations» — по нему ищет тест.

- [ ] **Step 4: Перенести экран**

Взять `F/components/profile/HistoryScreen.tsx`. Применить T1–T5, T7. Правило T6
**не применяется** — здесь курсорная пагинация со своим состоянием.

Конкретно:
- `api.getTransactions(token, cur)` → `adapter.getTransactions(cur)`
- `import { FixedSizeList } from 'react-window'` остаётся — пакет в `dependencies`
- убрать зависимость от `useAuthStore`: условие `if (!token || loading) return`
  становится `if (loading) return`
- добавить рендер пустого состояния: если `items.length === 0 && !loading && !error` —
  строка с ключом `history.empty`
- добавить рендер ошибки: если `error` — `<div className="hud-profile-error">{error}</div>`

В `ProfileShell.tsx` заменить заглушку на `{screen === 'history' && <HistoryScreen />}`.

- [ ] **Step 5: Прогнать тесты**

Run: `cd /Users/ivan/PhpStormProjects/game-hud && npx vitest run src/profile/HistoryScreen.test.tsx`
Expected: 6 passed.

- [ ] **Step 6: Коммит**

```bash
cd /Users/ivan/PhpStormProjects/game-hud
git add src/profile/ src/i18n/locales/
git commit -m "feat(profile): история транзакций с курсорной пагинацией"
```

---

### Task 14: Рефералы

**Files:**
- Create: `L/src/profile/ReferralsScreen.tsx`, `L/src/profile/ReferralsScreen.test.tsx`
- Modify: `L/src/profile/ProfileShell.tsx`
- Read: `F/components/profile/ReferralsScreen.tsx` (195 строк)

- [ ] **Step 1: Написать падающий тест**

`L/src/profile/ReferralsScreen.test.tsx`:

```tsx
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ReferralsScreen } from './ReferralsScreen';
import { renderWithHud } from '../test/renderWithHud';
import { makeFakeAdapter, makeFailingAdapter } from '../test/fakeAdapter';

describe('ReferralsScreen', () => {
  it('показывает счётчик приглашённых и заработок', async () => {
    renderWithHud(<ReferralsScreen />);
    await waitFor(() => expect(screen.getByText('2')).toBeInTheDocument());
    expect(screen.getByText('1.25')).toBeInTheDocument();
  });

  it('показывает выданную сервером ссылку, а не собранную на клиенте', async () => {
    renderWithHud(<ReferralsScreen />);
    await waitFor(() =>
      expect(screen.getByText(/t\.me\/test_bot\?start=ABC123/)).toBeInTheDocument(),
    );
  });

  it('копирует ссылку в буфер по кнопке', async () => {
    const writeText = vi.fn(async () => {});
    Object.assign(navigator, { clipboard: { writeText } });
    renderWithHud(<ReferralsScreen />);
    await waitFor(() => expect(screen.getByText('2')).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: /copy/i }));
    expect(writeText).toHaveBeenCalledWith('https://t.me/test_bot?start=ABC123');
  });

  it('показывает список приглашённых', async () => {
    renderWithHud(<ReferralsScreen />);
    await waitFor(() => expect(screen.getByText('Ann')).toBeInTheDocument());
  });

  it('показывает ошибку загрузки', async () => {
    renderWithHud(<ReferralsScreen />, { adapter: makeFailingAdapter('no refs') });
    await waitFor(() => expect(screen.getByText(/no refs/i)).toBeInTheDocument());
  });

  it('показывает скелетон, пока данные едут', () => {
    const adapter = makeFakeAdapter({
      getReferrals: vi.fn(() => new Promise(() => {})) as never,
    });
    renderWithHud(<ReferralsScreen />, { adapter });
    expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true');
  });
});
```

- [ ] **Step 2: Убедиться, что тест падает**

Run: `cd /Users/ivan/PhpStormProjects/game-hud && npx vitest run src/profile/ReferralsScreen.test.tsx`
Expected: FAIL — `Failed to resolve import "./ReferralsScreen"`.

- [ ] **Step 3: Перенести экран**

Взять `F/components/profile/ReferralsScreen.tsx`. Применить T1–T7, плюс:
- `useReferralLink()` не переносить — экран уже тянет `getReferrals()`, ссылку брать
  из `data?.refLink`
- пока `loading` — рендерить `<Skeleton rows={4} />` из `../primitives/Skeleton`
- при `error` — `<div className="hud-profile-error">{error}</div>`
- T5 для `totalEarnedTon`, `refBalance` и `earnedFromThemTon` у каждого приглашённого

В `ProfileShell.tsx` заменить заглушку на `{screen === 'referrals' && <ReferralsScreen />}`.

- [ ] **Step 4: Прогнать тесты**

Run: `cd /Users/ivan/PhpStormProjects/game-hud && npx vitest run src/profile/ReferralsScreen.test.tsx`
Expected: 6 passed.

- [ ] **Step 5: Коммит**

```bash
cd /Users/ivan/PhpStormProjects/game-hud
git add src/profile/
git commit -m "feat(profile): экран рефералов"
```

---

### Task 15: Статистика

**Files:**
- Create: `L/src/profile/StatsScreen.tsx`, `L/src/profile/StatsScreen.test.tsx`
- Modify: `L/src/profile/ProfileShell.tsx`
- Read: `F/components/profile/StatsScreen.tsx` (169 строк)

- [ ] **Step 1: Написать падающий тест**

`L/src/profile/StatsScreen.test.tsx`:

```tsx
import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { StatsScreen } from './StatsScreen';
import { renderWithHud } from '../test/renderWithHud';
import { makeFakeAdapter, makeFailingAdapter } from '../test/fakeAdapter';

describe('StatsScreen', () => {
  it('показывает сыгранные раунды и лучший коэффициент', async () => {
    renderWithHud(<StatsScreen />);
    await waitFor(() => expect(screen.getByText('42')).toBeInTheDocument());
    expect(screen.getByText(/7\.31/)).toBeInTheDocument();
  });

  it('форматирует денежные поля единым форматтером', async () => {
    renderWithHud(<StatsScreen />);
    await waitFor(() => expect(screen.getByText(/20\.00/)).toBeInTheDocument());
  });

  it('печатает винрейт процентами, а не долей', async () => {
    renderWithHud(<StatsScreen />);
    await waitFor(() => expect(screen.getByText(/55/)).toBeInTheDocument());
    expect(screen.queryByText('0.55')).not.toBeInTheDocument();
  });

  it('переживает отсутствие перцентилей', async () => {
    const adapter = makeFakeAdapter({
      getPercentiles: vi.fn(async () => ({
        rounds: null,
        bestMult: null,
        winrate: null,
        profit: null,
        avgBet: null,
      })),
    });
    renderWithHud(<StatsScreen />, { adapter });
    await waitFor(() => expect(screen.getByText('42')).toBeInTheDocument());
  });

  it('показывает ошибку загрузки', async () => {
    renderWithHud(<StatsScreen />, { adapter: makeFailingAdapter('stats down') });
    await waitFor(() => expect(screen.getByText(/stats down/i)).toBeInTheDocument());
  });
});
```

- [ ] **Step 2: Убедиться, что тест падает**

Run: `cd /Users/ivan/PhpStormProjects/game-hud && npx vitest run src/profile/StatsScreen.test.tsx`
Expected: FAIL — `Failed to resolve import "./StatsScreen"`.

- [ ] **Step 3: Перенести экран**

Взять `F/components/profile/StatsScreen.tsx`. Применить T1–T7, плюс:
- два запроса: `useHudResource('stats', (a) => a.getStats())` и
  `useHudResource('percentiles', (a) => a.getPercentiles())`
- скелетон, пока грузится основная статистика; перцентили рисуются по мере готовности
  и их отсутствие экран не блокирует
- при ошибке основной статистики — `<div className="hud-profile-error">{error}</div>`

В `ProfileShell.tsx` заменить заглушку на `{screen === 'stats' && <StatsScreen />}`.

- [ ] **Step 4: Прогнать тесты**

Run: `cd /Users/ivan/PhpStormProjects/game-hud && npx vitest run src/profile/StatsScreen.test.tsx`
Expected: 5 passed.

- [ ] **Step 5: Коммит**

```bash
cd /Users/ivan/PhpStormProjects/game-hud
git add src/profile/
git commit -m "feat(profile): экран статистики с перцентилями"
```

---

### Task 16: Лидерборд

**Files:**
- Create: `L/src/profile/LeaderboardScreen.tsx`, `L/src/profile/LeaderboardScreen.test.tsx`
- Modify: `L/src/profile/ProfileShell.tsx`, `L/src/theme/styles.css`
- Read: `F/components/profile/LeaderboardScreen.tsx` (175 строк)

- [ ] **Step 1: Написать падающий тест**

`L/src/profile/LeaderboardScreen.test.tsx`:

```tsx
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { LeaderboardScreen } from './LeaderboardScreen';
import { renderWithHud } from '../test/renderWithHud';
import { makeFakeAdapter, makeFailingAdapter, FAKE_LEADERBOARD } from '../test/fakeAdapter';

describe('LeaderboardScreen', () => {
  it('грузит profit / 7d по умолчанию', async () => {
    const adapter = makeFakeAdapter();
    renderWithHud(<LeaderboardScreen />, { adapter });
    await waitFor(() => expect(adapter.getLeaderboard).toHaveBeenCalledWith('profit', '7d'));
  });

  it('перезапрашивает при смене метрики', async () => {
    const adapter = makeFakeAdapter();
    renderWithHud(<LeaderboardScreen />, { adapter });
    await waitFor(() => expect(screen.getByText('Top')).toBeInTheDocument());
    await userEvent.selectOptions(screen.getAllByRole('combobox')[0], 'multiplier');
    await waitFor(() => expect(adapter.getLeaderboard).toHaveBeenCalledWith('multiplier', '7d'));
  });

  it('перезапрашивает при смене окна', async () => {
    const adapter = makeFakeAdapter();
    renderWithHud(<LeaderboardScreen />, { adapter });
    await waitFor(() => expect(screen.getByText('Top')).toBeInTheDocument());
    await userEvent.selectOptions(screen.getAllByRole('combobox')[1], '30d');
    await waitFor(() => expect(adapter.getLeaderboard).toHaveBeenCalledWith('profit', '30d'));
  });

  it('показывает строку «я», когда сервер её вернул', async () => {
    const adapter = makeFakeAdapter({
      getLeaderboard: vi.fn(async () => ({
        ...FAKE_LEADERBOARD,
        me: { ...FAKE_LEADERBOARD.top[0], rank: 17, name: 'Me', userId: 'u1' },
      })),
    });
    renderWithHud(<LeaderboardScreen />, { adapter });
    await waitFor(() => expect(screen.getByText('Me')).toBeInTheDocument());
  });

  it('подписывает оборот валютой из конфига, а не хардкодом TON', async () => {
    const adapter = makeFakeAdapter();
    renderWithHud(<LeaderboardScreen />, { adapter, config: { currency: 'GRAM' } });
    await waitFor(() => expect(screen.getByText('Top')).toBeInTheDocument());
    await userEvent.selectOptions(screen.getAllByRole('combobox')[0], 'turnover');
    await waitFor(() => expect(screen.getByText(/GRAM/)).toBeInTheDocument());
  });

  it('показывает ошибку загрузки', async () => {
    renderWithHud(<LeaderboardScreen />, { adapter: makeFailingAdapter('lb down') });
    await waitFor(() => expect(screen.getByText(/lb down/i)).toBeInTheDocument());
  });
});
```

- [ ] **Step 2: Убедиться, что тест падает**

Run: `cd /Users/ivan/PhpStormProjects/game-hud && npx vitest run src/profile/LeaderboardScreen.test.tsx`
Expected: FAIL — `Failed to resolve import "./LeaderboardScreen"`.

- [ ] **Step 3: Перенести экран**

Взять `F/components/profile/LeaderboardScreen.tsx`. Применить T1–T7, плюс:
- локальный `useState` для `mode` и `win` сохранить, загрузку перевести на
  `useHudResource(\`lb:${mode}:${win}\`, (a) => a.getLeaderboard(mode, win))` —
  параметры входят в ключ, поэтому смена селектора сама вызывает перезапрос
- хардкод `'TON'` в `valueFor` заменить на `useHudConfig().currency`
- хардкод цветов `#ffd35a`, `#c8cce0`, `#ff7a59` в `valueColor` заменить на классы
  `hud-lb-value--mult`, `hud-lb-value--turnover`, `hud-lb-value--loss`

Дописать в `L/src/theme/styles.css`:

```css
.hud-lb-value--mult { color: var(--hud-gold); }
.hud-lb-value--turnover { color: var(--hud-ink-soft); }
.hud-lb-value--loss { color: var(--hud-coral); }
```

В `ProfileShell.tsx` заменить заглушку на `{screen === 'leaderboard' && <LeaderboardScreen />}`.

- [ ] **Step 4: Прогнать тесты**

Run: `cd /Users/ivan/PhpStormProjects/game-hud && npx vitest run src/profile/LeaderboardScreen.test.tsx`
Expected: 6 passed.

- [ ] **Step 5: Коммит**

```bash
cd /Users/ivan/PhpStormProjects/game-hud
git add src/profile/ src/theme/styles.css
git commit -m "feat(profile): лидерборд с селекторами метрики и окна"
```

---

### Task 17: Уведомления

**Files:**
- Create: `L/src/profile/NotificationsScreen.tsx`, `L/src/profile/NotificationsScreen.test.tsx`
- Modify: `L/src/profile/ProfileShell.tsx`
- Read: `F/components/profile/NotificationsScreen.tsx` (108 строк)

- [ ] **Step 1: Написать падающий тест**

`L/src/profile/NotificationsScreen.test.tsx`:

```tsx
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { NotificationsScreen } from './NotificationsScreen';
import { renderWithHud } from '../test/renderWithHud';
import { makeFakeAdapter, makeFailingAdapter } from '../test/fakeAdapter';

describe('NotificationsScreen', () => {
  it('рисует все 11 переключателей', async () => {
    renderWithHud(<NotificationsScreen />);
    await waitFor(() => expect(screen.getAllByRole('checkbox')).toHaveLength(11));
  });

  it('расставляет положения по ответу сервера', async () => {
    renderWithHud(<NotificationsScreen />);
    const boxes = await screen.findAllByRole('checkbox');
    // В FAKE_PREFS включены четыре: deposit_credited, withdraw_confirmed,
    // withdraw_failed, big_win_self.
    expect(boxes.filter((b) => (b as HTMLInputElement).checked)).toHaveLength(4);
  });

  it('шлёт только изменённый ключ', async () => {
    const adapter = makeFakeAdapter();
    renderWithHud(<NotificationsScreen />, { adapter });
    const boxes = await screen.findAllByRole('checkbox');
    await userEvent.click(boxes[3]);
    await waitFor(() => expect(adapter.putNotificationPrefs).toHaveBeenCalledTimes(1));
    const sent = (adapter.putNotificationPrefs as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(Object.keys(sent)).toHaveLength(1);
  });

  it('возвращает переключатель назад, если сохранение упало', async () => {
    const adapter = makeFakeAdapter({
      putNotificationPrefs: vi.fn(async () => {
        throw new Error('save failed');
      }) as never,
    });
    renderWithHud(<NotificationsScreen />, { adapter });
    const boxes = await screen.findAllByRole('checkbox');
    const before = (boxes[3] as HTMLInputElement).checked;
    await userEvent.click(boxes[3]);
    await waitFor(() =>
      expect((screen.getAllByRole('checkbox')[3] as HTMLInputElement).checked).toBe(before),
    );
  });

  it('ссылается на бота из конфига, а не на захардкоженного', async () => {
    renderWithHud(<NotificationsScreen />, { config: { botUsername: 'my_bot' } });
    await waitFor(() => expect(screen.getAllByRole('checkbox')).toHaveLength(11));
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', expect.stringContaining('my_bot'));
  });

  it('показывает ошибку загрузки', async () => {
    renderWithHud(<NotificationsScreen />, { adapter: makeFailingAdapter('prefs down') });
    await waitFor(() => expect(screen.getByText(/prefs down/i)).toBeInTheDocument());
  });
});
```

- [ ] **Step 2: Убедиться, что тест падает**

Run: `cd /Users/ivan/PhpStormProjects/game-hud && npx vitest run src/profile/NotificationsScreen.test.tsx`
Expected: FAIL — `Failed to resolve import "./NotificationsScreen"`.

- [ ] **Step 3: Перенести экран**

Взять `F/components/profile/NotificationsScreen.tsx`. Применить T1–T7, плюс:
- загрузка через `useHudResource('prefs', (a) => a.getNotificationPrefs())`
- локальная копия для оптимистичного переключения; при ошибке `putNotificationPrefs`
  вернуть прежнее значение
- ссылка на бота строится из `useHudConfig().botUsername`, а не из захардкоженного
  `'jubb_app_bot'`
- при ошибке загрузки — `<div className="hud-profile-error">{error}</div>`

В `ProfileShell.tsx` заменить заглушку на
`{screen === 'notifications' && <NotificationsScreen />}`.

- [ ] **Step 4: Прогнать тесты**

Run: `cd /Users/ivan/PhpStormProjects/game-hud && npx vitest run src/profile/NotificationsScreen.test.tsx`
Expected: 6 passed.

- [ ] **Step 5: Коммит**

```bash
cd /Users/ivan/PhpStormProjects/game-hud
git add src/profile/
git commit -m "feat(profile): экран уведомлений с откатом при ошибке сохранения"
```

---

### Task 18: Язык, саппорт, юридические документы

**Files:**
- Create: `L/src/profile/LanguageScreen.tsx`, `L/src/profile/HelpScreen.tsx`, `L/src/profile/LegalScreen.tsx`, `L/src/profile/LanguageScreen.test.tsx`, `L/src/profile/HelpScreen.test.tsx`, `L/src/profile/LegalScreen.test.tsx`
- Modify: `L/src/profile/ProfileShell.tsx`
- Read: `F/components/profile/LanguageScreen.tsx` (36), `F/components/profile/HelpScreen.tsx` (266), `M/profile/LegalScreen.tsx` (78)

- [ ] **Step 1: Написать падающие тесты**

`L/src/profile/LanguageScreen.test.tsx`:

```tsx
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { LanguageScreen } from './LanguageScreen';
import { renderWithHud } from '../test/renderWithHud';

describe('LanguageScreen', () => {
  it('показывает все десять языков', () => {
    renderWithHud(<LanguageScreen />);
    expect(screen.getAllByRole('button')).toHaveLength(10);
  });

  it('переключает язык в i18next по клику', async () => {
    renderWithHud(<LanguageScreen />);
    await userEvent.click(screen.getByText(/Русский/i));
    expect(document.documentElement.lang).toBe('ru');
  });
});
```

`L/src/profile/HelpScreen.test.tsx`:

```tsx
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { HelpScreen } from './HelpScreen';
import { useHudStore } from '../store/hudStore';
import { renderWithHud } from '../test/renderWithHud';
import { makeFakeAdapter } from '../test/fakeAdapter';

describe('HelpScreen', () => {
  beforeEach(() => {
    useHudStore.setState({ open: true, screen: 'help', walletFocus: null, helpTheme: null });
  });

  it('не отправляет пустое обращение', async () => {
    const adapter = makeFakeAdapter();
    renderWithHud(<HelpScreen />, { adapter });
    await userEvent.click(screen.getByRole('button', { name: /send/i }));
    expect(adapter.postSupport).not.toHaveBeenCalled();
  });

  it('отправляет текст с темой по умолчанию', async () => {
    const adapter = makeFakeAdapter();
    renderWithHud(<HelpScreen />, { adapter });
    await userEvent.type(screen.getByRole('textbox'), 'не пришёл депозит');
    await userEvent.click(screen.getByRole('button', { name: /send/i }));
    await waitFor(() =>
      expect(adapter.postSupport).toHaveBeenCalledWith('не пришёл депозит', 'other', []),
    );
  });

  it('подставляет тему, с которой экран открыли', async () => {
    useHudStore.setState({ open: true, screen: 'help', helpTheme: 'finance' });
    const adapter = makeFakeAdapter();
    renderWithHud(<HelpScreen />, { adapter });
    await userEvent.type(screen.getByRole('textbox'), 'вопрос');
    await userEvent.click(screen.getByRole('button', { name: /send/i }));
    await waitFor(() => expect(adapter.postSupport).toHaveBeenCalledWith('вопрос', 'finance', []));
  });

  it('гасит тему в сторе после отправки', async () => {
    useHudStore.setState({ open: true, screen: 'help', helpTheme: 'bug' });
    renderWithHud(<HelpScreen />);
    await userEvent.type(screen.getByRole('textbox'), 'баг');
    await userEvent.click(screen.getByRole('button', { name: /send/i }));
    await waitFor(() => expect(useHudStore.getState().helpTheme).toBeNull());
  });
});
```

`L/src/profile/LegalScreen.test.tsx`:

```tsx
import { screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LegalScreen } from './LegalScreen';
import { renderWithHud } from '../test/renderWithHud';

afterEach(() => vi.unstubAllGlobals());

describe('LegalScreen', () => {
  it('рендерит markdown React-узлами, а не через innerHTML', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        text: async () => '# Title\n\nПростой **жирный** текст.',
      })),
    );
    const { container } = renderWithHud(<LegalScreen doc="terms" />);
    await waitFor(() => expect(screen.getByText('Title')).toBeInTheDocument());
    expect(container.querySelector('strong')).toHaveTextContent('жирный');
  });

  it('не исполняет разметку из документа', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        text: async () => 'Опасно <img src=x onerror=alert(1)>',
      })),
    );
    const { container } = renderWithHud(<LegalScreen doc="privacy" />);
    await waitFor(() => expect(screen.getByText(/Опасно/)).toBeInTheDocument());
    expect(container.querySelector('img')).toBeNull();
  });

  it('показывает ошибку, если документ не отдался', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, text: async () => '' })));
    renderWithHud(<LegalScreen doc="offer" />);
    await waitFor(() =>
      expect(document.querySelector('.hud-profile-error')).toBeInTheDocument(),
    );
  });
});
```

- [ ] **Step 2: Убедиться, что тесты падают**

Run:
```bash
cd /Users/ivan/PhpStormProjects/game-hud && npx vitest run \
  src/profile/LanguageScreen.test.tsx \
  src/profile/HelpScreen.test.tsx \
  src/profile/LegalScreen.test.tsx
```
Expected: FAIL — три `Failed to resolve import`.

- [ ] **Step 3: Перенести LanguageScreen и HelpScreen**

`L/src/profile/LanguageScreen.tsx` — копия `F/components/profile/LanguageScreen.tsx`
с T4, T7; список языков брать из `SUPPORTED_LANGUAGES` в `../i18n`, направление письма —
из `RTL_LANGUAGES`.

`L/src/profile/HelpScreen.tsx` — копия `F/components/profile/HelpScreen.tsx` с T1–T7, плюс:
- `api.postSupport(token, text, files, theme)` → `adapter.postSupport(text, theme, files)`
  (порядок аргументов приведён к контракту адаптера)
- начальная тема — `helpTheme ?? 'other'` из стора, после успешной отправки вызывать
  `clearHelpTheme()`
- кнопка отправки заблокирована при пустом тексте

- [ ] **Step 4: Перенести LegalScreen из matreshka**

Берём версию matreshka (`M/profile/LegalScreen.tsx`), а не fatman: она собирает
markdown в React-узлы, тогда как fatman использует `dangerouslySetInnerHTML`.
Применить T4, T7. Пути к документам оставить относительными (`/legal/terms.md`
и так далее) — файлы лежат в `public/` каждой игры. При `!res.ok` рендерить
`<div className="hud-profile-error">`.

В `ProfileShell.tsx` заменить оставшиеся заглушки:

```tsx
{screen === 'language' && <LanguageScreen />}
{screen === 'help' && <HelpScreen />}
{screen === 'terms' && <LegalScreen doc="terms" />}
{screen === 'privacy' && <LegalScreen doc="privacy" />}
{screen === 'offer' && <LegalScreen doc="offer" />}
```

- [ ] **Step 5: Прогнать все тесты кабинета**

Run: `cd /Users/ivan/PhpStormProjects/game-hud && npx vitest run src/profile/`
Expected: все зелёные, заглушек в `ProfileShell` не осталось.

- [ ] **Step 6: Коммит**

```bash
cd /Users/ivan/PhpStormProjects/game-hud
git add src/profile/
git commit -m "feat(profile): язык, саппорт и юридические документы без innerHTML"
```

---

# Часть E. HUD и ставка

### Task 19: Элементы верхнего HUD

**Files:**
- Create: `L/src/hud/BalanceChip.tsx`, `L/src/hud/ProfileAvatarButton.tsx`, `L/src/hud/SettingsButton.tsx`, `L/src/hud/SettingsMenu.tsx`, `L/src/hud/SoundSettings.tsx`, `L/src/hud/TopBar.tsx`, `L/src/hud/hud.test.tsx`
- Read: `F/components/BalanceChip.tsx` (26), `F/components/ProfileAvatarButton.tsx` (27), `F/components/SoundSettings.tsx` (168), `M/game/TopBar.tsx` (80), `M/game/SettingsSheet.tsx` (69)

- [ ] **Step 1: Написать падающий тест**

`L/src/hud/hud.test.tsx`:

```tsx
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { BalanceChip } from './BalanceChip';
import { ProfileAvatarButton } from './ProfileAvatarButton';
import { SettingsButton } from './SettingsButton';
import { useHudStore } from '../store/hudStore';
import { renderWithHud } from '../test/renderWithHud';

describe('верхний HUD', () => {
  beforeEach(() => {
    useHudStore.setState({ open: false, screen: 'hub', walletFocus: null, helpTheme: null });
  });

  it('баланс-пилюля печатает переданное значение единым форматтером', () => {
    renderWithHud(<BalanceChip balance={7} />);
    expect(screen.getByText('7.00')).toBeInTheDocument();
  });

  it('тап по пилюле открывает кошелёк с фокусом на пополнении', async () => {
    renderWithHud(<BalanceChip balance={7} />);
    await userEvent.click(screen.getByRole('button'));
    expect(useHudStore.getState()).toMatchObject({
      open: true,
      screen: 'wallet',
      walletFocus: 'deposit',
    });
  });

  it('тап по аватару открывает кабинет', async () => {
    renderWithHud(<ProfileAvatarButton />);
    await userEvent.click(screen.getByRole('button'));
    expect(useHudStore.getState()).toMatchObject({ open: true, screen: 'hub' });
  });

  it('шестерёнка раскрывает меню', async () => {
    renderWithHud(<SettingsButton onHowToPlay={() => {}} />);
    await userEvent.click(screen.getByRole('button', { expanded: false }));
    await waitFor(() =>
      expect(screen.getByRole('button', { expanded: true })).toBeInTheDocument(),
    );
  });

  it('клик вне меню его закрывает', async () => {
    renderWithHud(
      <div>
        <SettingsButton onHowToPlay={() => {}} />
        <button type="button">снаружи</button>
      </div>,
    );
    await userEvent.click(screen.getByRole('button', { expanded: false }));
    await waitFor(() =>
      expect(screen.getByRole('button', { expanded: true })).toBeInTheDocument(),
    );
    await userEvent.click(screen.getByText('снаружи'));
    await waitFor(() =>
      expect(screen.queryByRole('button', { expanded: true })).not.toBeInTheDocument(),
    );
  });

  it('пункт «как играть» дёргает переданный обработчик и закрывает меню', async () => {
    let called = false;
    renderWithHud(<SettingsButton onHowToPlay={() => { called = true; }} />);
    await userEvent.click(screen.getByRole('button', { expanded: false }));
    await userEvent.click(await screen.findByText(/how to play/i));
    expect(called).toBe(true);
    expect(screen.queryByRole('button', { expanded: true })).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Убедиться, что тест падает**

Run: `cd /Users/ivan/PhpStormProjects/game-hud && npx vitest run src/hud/hud.test.tsx`
Expected: FAIL — `Failed to resolve import "./BalanceChip"`.

- [ ] **Step 3: Написать BalanceChip и ProfileAvatarButton**

`L/src/hud/BalanceChip.tsx`:

```tsx
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { fmtAmount } from '../format/money';
import { useHudStore } from '../store/hudStore';

/**
 * Баланс приходит пропсом, а не из адаптера: во время раунда игра гоняет его
 * через свой стор и анимирует одометр, и лишний запрос тут только мешал бы.
 */
export function BalanceChip({
  balance,
  icon,
}: {
  balance: number | null;
  icon?: ReactNode;
}) {
  const { t } = useTranslation();
  const openWallet = useHudStore((s) => s.openWalletWithFocus);
  return (
    <button
      type="button"
      className="hud-bal-chip"
      onClick={() => openWallet('deposit')}
      aria-label={t('wallet.title')}
    >
      <span className="hud-bal-num">{fmtAmount(balance)}</span>
      {icon}
    </button>
  );
}
```

`L/src/hud/ProfileAvatarButton.tsx` — копия `F/components/ProfileAvatarButton.tsx`
с T2, T4: фото берётся из `window.Telegram?.WebApp?.initDataUnsafe?.user?.photo_url`,
клик вызывает `openProfile()`, при отсутствии фото рисуется SVG-силуэт из
`M/game/TopBar.tsx:55-58`.

- [ ] **Step 4: Написать SettingsButton, SettingsMenu, SoundSettings, TopBar**

`L/src/hud/SettingsMenu.tsx` — копия `M/game/SettingsSheet.tsx` с T4: пункты
музыка / SFX / как играть, все обработчики приходят пропсами.

`L/src/hud/SettingsButton.tsx` — шестерёнка с выпадающим меню; логика закрытия по
`pointerdown` вне контейнера взята из `M/game/TopBar.tsx:36-43`. Атрибут
`aria-expanded` на кнопке обязателен — по нему находит тест. Иконка шестерёнки —
inline SVG из `M/game/TopBar.tsx:70-73`.

`L/src/hud/SoundSettings.tsx` — копия `F/components/SoundSettings.tsx` с T4, T7.
Аудио-движка у библиотеки нет: компонент принимает
`{ musicOn, sfxOn, onToggleMusic, onToggleSfx }` пропсами, звуком управляет игра.

`L/src/hud/TopBar.tsx`:

```tsx
import type { ReactNode } from 'react';
import { BalanceChip } from './BalanceChip';
import { ProfileAvatarButton } from './ProfileAvatarButton';
import { SettingsButton } from './SettingsButton';

/**
 * Удобная сборка для игр, которым подходит раскладка «баланс слева, аватар и
 * шестерёнка справа». fatman расставляет элементы абсолютным позиционированием
 * и этот компонент не использует — поэтому части экспортируются отдельно.
 */
export function TopBar({
  balance,
  logo,
  balanceIcon,
  onHowToPlay,
}: {
  balance: number | null;
  logo?: ReactNode;
  balanceIcon?: ReactNode;
  onHowToPlay: () => void;
}) {
  return (
    <div className="hud-topbar">
      {logo}
      <BalanceChip balance={balance} icon={balanceIcon} />
      <div className="hud-user">
        <ProfileAvatarButton />
        <SettingsButton onHowToPlay={onHowToPlay} />
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Прогнать тесты**

Run: `cd /Users/ivan/PhpStormProjects/game-hud && npx vitest run src/hud/`
Expected: 6 passed.

- [ ] **Step 6: Коммит**

```bash
cd /Users/ivan/PhpStormProjects/game-hud
git add src/hud/
git commit -m "feat(hud): баланс, аватар, настройки и готовая раскладка TopBar"
```

---

### Task 20: Боттом-шит кошелька

**Files:**
- Create: `L/src/wallet/WalletSheet.tsx`, `L/src/wallet/WalletSheet.test.tsx`
- Read: `F/components/WalletSheet.tsx` (262 строки)

- [ ] **Step 1: Написать падающий тест**

`L/src/wallet/WalletSheet.test.tsx`:

```tsx
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { WalletSheet } from './WalletSheet';
import { renderWithHud } from '../test/renderWithHud';
import { makeFakeAdapter } from '../test/fakeAdapter';

vi.mock('@tonconnect/ui-react', () => ({
  useTonAddress: () => 'EQUserWallet',
  useTonConnectUI: () => [{ openModal: vi.fn(), sendTransaction: vi.fn() }],
  TonConnectButton: () => <button type="button">TonConnect</button>,
}));

describe('WalletSheet', () => {
  it('закрытый ничего не рендерит', () => {
    const { container } = renderWithHud(<WalletSheet open={false} onClose={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('открытый показывает адрес депозита', async () => {
    renderWithHud(<WalletSheet open onClose={() => {}} />);
    await waitFor(() => expect(screen.getByText(/EQTestAddress/)).toBeInTheDocument());
  });

  it('закрывается по тапу вне панели', async () => {
    const onClose = vi.fn();
    const { container } = renderWithHud(<WalletSheet open onClose={onClose} />);
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
    await userEvent.click(container.querySelector('.hud-sheet-backdrop')!);
    expect(onClose).toHaveBeenCalled();
  });

  it('закрывается по Escape', async () => {
    const onClose = vi.fn();
    renderWithHud(<WalletSheet open onClose={onClose} />);
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalled();
  });

  it('шлёт вывод через адаптер', async () => {
    const adapter = makeFakeAdapter();
    renderWithHud(<WalletSheet open onClose={() => {}} />, { adapter });
    const input = await screen.findByPlaceholderText(/amount/i);
    await userEvent.type(input, '2');
    await userEvent.click(screen.getByRole('button', { name: /withdraw/i }));
    await waitFor(() => expect(adapter.postWithdraw).toHaveBeenCalledWith(2, 'EQUserWallet'));
  });
});
```

- [ ] **Step 2: Убедиться, что тест падает**

Run: `cd /Users/ivan/PhpStormProjects/game-hud && npx vitest run src/wallet/`
Expected: FAIL — `Failed to resolve import "./WalletSheet"`.

- [ ] **Step 3: Перенести шит**

Взять `F/components/WalletSheet.tsx`. Применить T1–T7, плюс:
- обвязку подложки и панели заменить на `<BottomSheet>` из `../primitives/BottomSheet`
- `open` и `onClose` приходят пропсами: у fatman это `uiStore`, который в библиотеку
  не переезжает — открытием шита управляет игра
- вызовы api заменить на адаптер так же, как в Task 12

- [ ] **Step 4: Прогнать тесты**

Run: `cd /Users/ivan/PhpStormProjects/game-hud && npx vitest run src/wallet/`
Expected: 5 passed.

- [ ] **Step 5: Коммит**

```bash
cd /Users/ivan/PhpStormProjects/game-hud
git add src/wallet/
git commit -m "feat(wallet): боттом-шит кошелька поверх примитива BottomSheet"
```

---

### Task 21: Ввод суммы ставки

**Files:**
- Create: `L/src/bet/useBetAmount.ts`, `L/src/bet/useBetAmount.test.ts`, `L/src/bet/BetAmountInput.tsx`, `L/src/bet/BetAmountInput.test.tsx`
- Modify: `L/src/theme/styles.css`
- Read: `M/game/BetPanel.tsx:1-115`, `M/game/Stepper.tsx` (128 строк)

- [ ] **Step 1: Написать падающий тест логики**

`L/src/bet/useBetAmount.test.ts`:

```ts
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useBetAmount } from './useBetAmount';

const LIMITS = { min: 0.1, max: 100, balance: 12.5 };

describe('useBetAmount', () => {
  it('стартует с минимальной ставки', () => {
    const { result } = renderHook(() => useBetAmount(LIMITS));
    expect(result.current.amount).toBe(0.1);
  });

  it('шаг вверх и вниз двигает на min', () => {
    const { result } = renderHook(() => useBetAmount(LIMITS));
    act(() => result.current.step(1));
    expect(result.current.amount).toBeCloseTo(0.2);
    act(() => result.current.step(-1));
    expect(result.current.amount).toBeCloseTo(0.1);
  });

  it('не опускается ниже минимума', () => {
    const { result } = renderHook(() => useBetAmount(LIMITS));
    act(() => result.current.step(-1));
    expect(result.current.amount).toBe(0.1);
  });

  it('не поднимается выше баланса, даже если max больше', () => {
    const { result } = renderHook(() => useBetAmount(LIMITS));
    act(() => result.current.set(50));
    expect(result.current.amount).toBe(12.5);
  });

  it('не поднимается выше max, даже если баланс больше', () => {
    const { result } = renderHook(() => useBetAmount({ min: 0.1, max: 5, balance: 1000 }));
    act(() => result.current.set(50));
    expect(result.current.amount).toBe(5);
  });

  it('удвоение упирается в потолок, а не улетает', () => {
    const { result } = renderHook(() => useBetAmount(LIMITS));
    act(() => result.current.set(10));
    act(() => result.current.double());
    expect(result.current.amount).toBe(12.5);
  });

  it('max ставит потолок из баланса и лимита', () => {
    const { result } = renderHook(() => useBetAmount(LIMITS));
    act(() => result.current.max());
    expect(result.current.amount).toBe(12.5);
  });

  it('не превращает NaN в ставку', () => {
    const { result } = renderHook(() => useBetAmount(LIMITS));
    act(() => result.current.set(Number.NaN));
    expect(result.current.amount).toBe(0.1);
  });

  it('считает ставку невалидной, когда баланса не хватает даже на минимум', () => {
    const { result } = renderHook(() => useBetAmount({ min: 1, max: 100, balance: 0.5 }));
    expect(result.current.valid).toBe(false);
  });

  it('пока баланс не приехал, потолком служит max', () => {
    const { result } = renderHook(() => useBetAmount({ min: 0.1, max: 7, balance: null }));
    act(() => result.current.max());
    expect(result.current.amount).toBe(7);
  });
});
```

- [ ] **Step 2: Убедиться, что тест падает**

Run: `cd /Users/ivan/PhpStormProjects/game-hud && npx vitest run src/bet/useBetAmount.test.ts`
Expected: FAIL — `Failed to resolve import "./useBetAmount"`.

- [ ] **Step 3: Написать хук**

`L/src/bet/useBetAmount.ts`:

```ts
import { useCallback, useMemo, useState } from 'react';

export interface BetLimits {
  min: number;
  max: number;
  /** null, пока баланс не загрузился — тогда потолком служит только max. */
  balance: number | null;
}

export interface BetAmount {
  amount: number;
  valid: boolean;
  ceiling: number;
  set: (v: number) => void;
  step: (dir: 1 | -1) => void;
  double: () => void;
  max: () => void;
}

/** Потолок ставки: меньшее из лимита и баланса; пока баланса нет — только лимит. */
export function betCeiling(max: number, balance: number | null): number {
  return balance == null ? max : Math.min(max, balance);
}

/**
 * Единственная реализация клампа суммы. Ею пользуются и хук, и управляемый
 * BetAmountInput — иначе правила разъедутся между двумя копиями.
 */
export function clampBet(v: number, min: number, ceiling: number): number {
  if (!Number.isFinite(v)) return min;
  return Math.min(Math.max(v, min), Math.max(ceiling, min));
}

/**
 * Сумма ставки с клампом. Живёт в библиотеке, потому что во всех играх правила
 * одни: шаг равен минимальной ставке, потолок — минимум из max и баланса,
 * а NaN и переполнение не должны доезжать до игровой кнопки.
 */
export function useBetAmount(limits: BetLimits): BetAmount {
  const ceiling = useMemo(
    () => betCeiling(limits.max, limits.balance),
    [limits.max, limits.balance],
  );

  const clamp = useCallback((v: number) => clampBet(v, limits.min, ceiling), [limits.min, ceiling]);

  const [amount, setAmount] = useState(() => clamp(limits.min));

  const set = useCallback((v: number) => setAmount(clamp(v)), [clamp]);
  const step = useCallback(
    (dir: 1 | -1) => setAmount((cur) => clamp(cur + dir * limits.min)),
    [clamp, limits.min],
  );
  const double = useCallback(() => setAmount((cur) => clamp(cur * 2)), [clamp]);
  const max = useCallback(() => setAmount(clamp(ceiling)), [clamp, ceiling]);

  return {
    amount,
    ceiling,
    valid: ceiling >= limits.min && amount >= limits.min && amount <= ceiling,
    set,
    step,
    double,
    max,
  };
}
```

- [ ] **Step 4: Написать падающий тест компонента**

`L/src/bet/BetAmountInput.test.tsx`:

```tsx
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { BetAmountInput } from './BetAmountInput';
import { renderWithHud } from '../test/renderWithHud';

describe('BetAmountInput', () => {
  it('показывает сумму форматтером библиотеки', () => {
    renderWithHud(
      <BetAmountInput value={1.5} onChange={() => {}} min={0.1} max={100} balance={50} />,
    );
    expect(screen.getByText('1.50')).toBeInTheDocument();
  });

  it('плюс и минус сообщают новую сумму наверх', async () => {
    const onChange = vi.fn();
    renderWithHud(
      <BetAmountInput value={1} onChange={onChange} min={0.5} max={100} balance={50} />,
    );
    await userEvent.click(screen.getByRole('button', { name: '+' }));
    expect(onChange).toHaveBeenCalledWith(1.5);
    await userEvent.click(screen.getByRole('button', { name: '−' }));
    expect(onChange).toHaveBeenCalledWith(0.5);
  });

  it('пресет ставит свою сумму', async () => {
    const onChange = vi.fn();
    renderWithHud(
      <BetAmountInput value={1} onChange={onChange} min={0.1} max={100} balance={50} />,
    );
    await userEvent.click(screen.getByRole('button', { name: '5' }));
    expect(onChange).toHaveBeenCalledWith(5);
  });

  it('MAX упирается в баланс', async () => {
    const onChange = vi.fn();
    renderWithHud(
      <BetAmountInput value={1} onChange={onChange} min={0.1} max={100} balance={12.5} />,
    );
    await userEvent.click(screen.getByRole('button', { name: /max/i }));
    expect(onChange).toHaveBeenCalledWith(12.5);
  });

  it('×2 не перепрыгивает потолок', async () => {
    const onChange = vi.fn();
    renderWithHud(
      <BetAmountInput value={10} onChange={onChange} min={0.1} max={100} balance={12.5} />,
    );
    await userEvent.click(screen.getByRole('button', { name: '×2' }));
    expect(onChange).toHaveBeenCalledWith(12.5);
  });

  it('не открывает системную клавиатуру: поля ввода нет', () => {
    renderWithHud(
      <BetAmountInput value={1} onChange={() => {}} min={0.1} max={100} balance={50} />,
    );
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 5: Написать компонент**

Разметку и классы взять из `M/game/BetPanel.tsx` (строка ставки: степпер слева,
карусель пресетов справа) и `M/game/Stepper.tsx`, применив T4, T7. Требования,
которые проверяют тесты: нативного `<input>` нет вообще — иначе на мобильном
всплывает клавиатура и ужимает зафиксированную сцену.

`L/src/bet/BetAmountInput.tsx`:

```tsx
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { fmtAmount } from '../format/money';
import { betCeiling, clampBet } from './useBetAmount';

const PRESETS = [0.1, 0.5, 1, 5];

/**
 * Управляемый ввод суммы: значение и коллбэк приходят снаружи, потому что
 * ставку игра держит в своём сторе и валидирует по фазе раунда. Игровую CTA
 * («Поставить», «Забрать») рисует игра — механики у всех разные.
 */
export function BetAmountInput({
  value,
  onChange,
  min,
  max,
  balance,
  icon,
}: {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  balance: number | null;
  icon?: ReactNode;
}) {
  const { t } = useTranslation();
  const ceiling = betCeiling(max, balance);
  const emit = (v: number) => onChange(clampBet(v, min, ceiling));

  return (
    <div className="hud-bet-row">
      <div className="hud-bet-stepper">
        <button
          type="button"
          className="hud-bet-step"
          aria-label="−"
          onClick={() => emit(value - min)}
        >
          −
        </button>
        <span className="hud-bet-value">
          {fmtAmount(value)}
          {icon}
        </span>
        <button
          type="button"
          className="hud-bet-step"
          aria-label="+"
          onClick={() => emit(value + min)}
        >
          +
        </button>
      </div>
      <div className="hud-bet-presets">
        {PRESETS.map((p) => (
          <button key={p} type="button" className="hud-bet-chip" onClick={() => emit(p)}>
            {p}
          </button>
        ))}
        <button type="button" className="hud-bet-chip" onClick={() => emit(value * 2)}>
          ×2
        </button>
        <button type="button" className="hud-bet-chip" onClick={() => emit(ceiling)}>
          {t('common.max', 'MAX')}
        </button>
      </div>
    </div>
  );
}
```

Стили `.hud-bet-row`, `.hud-bet-stepper`, `.hud-bet-step`, `.hud-bet-value`,
`.hud-bet-presets`, `.hud-bet-chip` перенести из `M/game/game.css` в
`L/src/theme/styles.css` с префиксом. Карусель должна быть full-bleed —
в matreshka это отдельный фикс (коммит «full-bleed chip carousel so the right side
isn't clipped by panel padding»), забрать его вместе с правилами.

- [ ] **Step 6: Прогнать тесты**

Run: `cd /Users/ivan/PhpStormProjects/game-hud && npx vitest run src/bet/`
Expected: 16 passed (10 у хука, 6 у компонента).

- [ ] **Step 7: Коммит**

```bash
cd /Users/ivan/PhpStormProjects/game-hud
git add src/bet/ src/theme/styles.css
git commit -m "feat(bet): ввод суммы ставки со степпером и пресетами"
```

---

# Часть F. Сборка и демо

### Task 22: Публичные экспорты и сборка

**Files:**
- Modify: `L/src/index.ts`
- Create: `L/demo/index.html`, `L/demo/main.tsx`

- [ ] **Step 1: Собрать публичный экспорт**

`L/src/index.ts`:

```ts
export { HudProvider, useHudAdapter, useHudConfig } from './context/HudProvider';
export { useHudResource, type HudResource } from './context/useHudResource';
export { useHudStore, type HudScreen } from './store/hudStore';
export { useTelegramSafeArea } from './theme/useTelegramSafeArea';
export { fmtAmount } from './format/money';

export { ProfileShell } from './profile/ProfileShell';
export { WalletSheet } from './wallet/WalletSheet';

export { TopBar } from './hud/TopBar';
export { BalanceChip } from './hud/BalanceChip';
export { ProfileAvatarButton } from './hud/ProfileAvatarButton';
export { SettingsButton } from './hud/SettingsButton';
export { SettingsMenu } from './hud/SettingsMenu';
export { SoundSettings } from './hud/SoundSettings';

export { BetAmountInput } from './bet/BetAmountInput';
export {
  useBetAmount,
  betCeiling,
  clampBet,
  type BetAmount,
  type BetLimits,
} from './bet/useBetAmount';

export { BottomSheet } from './primitives/BottomSheet';
export { InfoPopover } from './primitives/InfoPopover';
export { Skeleton } from './primitives/Skeleton';
export * from './primitives/icons';

export type * from './adapter/types';
```

Отдельные экраны кабинета наружу не экспортируются: игра работает с `ProfileShell`,
а навигацию держит стор. Это сохраняет свободу менять экраны без мажорной версии.

- [ ] **Step 2: Написать демо-страницу**

`L/demo/index.html`:

```html
<!doctype html>
<html lang="ru">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <title>game-hud demo</title>
    <link
      rel="stylesheet"
      href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,800&display=swap"
    />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="./main.tsx"></script>
  </body>
</html>
```

`L/demo/main.tsx`:

```tsx
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
```

Демо использует `makeFakeAdapter` из `src/test/` — он импортирует `vitest`, поэтому
`vitest` должен остаться в `devDependencies` (он там есть) и в бандл не попадёт:
`demo/` не входит в точки входа сборки библиотеки.

- [ ] **Step 3: Прогнать всё разом**

Run:
```bash
cd /Users/ivan/PhpStormProjects/game-hud && npm run typecheck && npx vitest run && npm run build
```
Expected: типы чисто, все тесты зелёные, в `dist/` лежат `index.js`, `i18n.js`,
`index.d.ts` и файл стилей.

- [ ] **Step 4: Сверить фактическое имя CSS с манифестом**

Run: `cd /Users/ivan/PhpStormProjects/game-hud && ls dist/*.css`
Expected: один css-файл. В манифесте `exports["./styles.css"]` указан `./dist/style.css` —
если vite назвал файл иначе, поправить манифест под фактическое имя и пересобрать.

- [ ] **Step 5: Посмотреть демо глазами**

Run: `cd /Users/ivan/PhpStormProjects/game-hud && npm run dev`
Открыть выданный адрес и проверить: верхний HUD, открытие кабинета, все 12 экранов
через меню, строка ввода ставки со степпером и пресетами. Ничего не должно быть
без стилей.

- [ ] **Step 6: Коммит**

```bash
cd /Users/ivan/PhpStormProjects/game-hud
git add src/index.ts demo/ package.json
git commit -m "feat(pkg): публичные экспорты и демо-страница"
```

---

### Task 23: Тег версии

**Files:** нет

- [ ] **Step 1: Убедиться, что дерево чистое и всё зелёное**

Run:
```bash
cd /Users/ivan/PhpStormProjects/game-hud && git status --short && npx vitest run && npm run build
```
Expected: пустой `git status`, тесты зелёные, сборка проходит.

- [ ] **Step 2: Поставить тег**

```bash
cd /Users/ivan/PhpStormProjects/game-hud
git tag -a v0.1.0 -m "game-hud 0.1.0 — кабинет, HUD, ввод ставки"
git tag
```
Expected: в выводе `v0.1.0`.

---

# Часть G. Интеграция fatman

### Task 24: Адаптер fatman

**Files:**
- Create: `F/hud/adapter.ts`
- Modify: `fatman/frontend/package.json`
- Read: `F/lib/api.ts`, `F/store/authStore.ts`

- [ ] **Step 1: Подключить библиотеку локально**

```bash
cd /Users/ivan/PhpStormProjects/fatman/frontend && \
  npm install "file:../../game-hud" && \
  node -e "console.log(require('./package.json').dependencies['@gonreg/game-hud'])"
```
Expected: строка со ссылкой на локальный путь. На боевой git-URL переключаемся
в Task 26.

- [ ] **Step 2: Написать адаптер**

`F/hud/adapter.ts`:

```ts
import type { HudAdapter } from '@gonreg/game-hud';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

/**
 * Реализация контракта библиотеки поверх REST API Толстяка.
 *
 * Токен читается из стора в момент вызова, а не захватывается замыканием:
 * авторизация приезжает асинхронно, и адаптер создаётся раньше неё.
 */
function token(): string {
  const t = useAuthStore.getState().token;
  if (!t) throw new Error('not_authenticated');
  return t;
}

export const hudAdapter: HudAdapter = {
  getMe: () => api.getMe(token()),
  getStats: () => api.getStats(token()),
  getPercentiles: () => api.getPercentiles(token()),
  getLeaderboard: (mode, window) => api.getLeaderboard(token(), mode, window),
  getReferrals: () => api.getReferrals(token()),
  getTransactions: (cursor) => api.getTransactions(token(), cursor),
  getNotificationPrefs: () => api.getNotificationPrefs(token()),
  putNotificationPrefs: (prefs) => api.putNotificationPrefs(token(), prefs),
  getDeposit: () => api.getDeposit(token()),
  // Толстяк выводит на привязанный кошелёк — адрес в запросе не нужен.
  postWithdraw: async (amount) => {
    await api.postWithdraw(token(), amount);
  },
  postSupport: async (text, theme, files) => {
    await api.postSupport(token(), text, files, theme);
  },
  postWalletLink: async (address) => {
    await api.postWalletLink(token(), address);
  },
  // getWithdrawals у этого бэка нет — блок списка выводов не рендерится.
};
```

- [ ] **Step 3: Проверить типы**

Run: `cd /Users/ivan/PhpStormProjects/fatman/frontend && npx tsc --noEmit`
Expected: без ошибок. Если ругается на несовпадение форм — приводить значения
в адаптере, а не менять типы библиотеки: контракт общий для шести игр.

- [ ] **Step 4: Коммит**

```bash
cd /Users/ivan/PhpStormProjects/fatman
git add frontend/src/hud/adapter.ts frontend/package.json frontend/package-lock.json
git commit -m "feat(hud): адаптер game-hud поверх REST API"
```

---

### Task 25: Перевод fatman на библиотеку

**Files:**
- Modify: `F/main.tsx`, `F/App.tsx`, `F/i18n/index.ts`
- Delete: `F/components/profile/` (весь каталог), `F/components/WalletSheet.tsx`, `F/components/BalanceChip.tsx`, `F/components/ProfileAvatarButton.tsx`, `F/components/SoundSettings.tsx`, `F/store/profileStore.ts`, `F/hooks/useProfileMe.ts`, `F/hooks/useReferralLink.ts`, `F/styles/profile.css`

- [ ] **Step 1: Подмешать словари библиотеки**

В `F/i18n/index.ts` добавить импорт и слить ресурсы так, чтобы игровые ключи
перекрывали библиотечные при совпадении:

```ts
import { hudLocales } from '@gonreg/game-hud/i18n';

// ...в init:
resources: {
  en: { translation: { ...hudLocales.en, ...en } },
  ru: { translation: { ...hudLocales.ru, ...ru } },
  es: { translation: { ...hudLocales.es, ...es } },
  de: { translation: { ...hudLocales.de, ...de } },
  fr: { translation: { ...hudLocales.fr, ...fr } },
  hi: { translation: { ...hudLocales.hi, ...hi } },
  ur: { translation: { ...hudLocales.ur, ...ur } },
  bn: { translation: { ...hudLocales.bn, ...bn } },
  si: { translation: { ...hudLocales.si, ...si } },
  ne: { translation: { ...hudLocales.ne, ...ne } },
},
```

- [ ] **Step 2: Найти лимиты ставки для конфига**

Run:
```bash
cd /Users/ivan/PhpStormProjects/fatman/frontend && \
  grep -rn "minBet\|MIN_BET\|maxBet\|MAX_BET" src/ | grep -v node_modules
```
Записать найденные значения — они пойдут в `config` на следующем шаге. Если констант
нет, взять минимум и максимум из текущего `BetPanel` fatman.

- [ ] **Step 3: Обернуть приложение в провайдер**

В `F/main.tsx` импортировать стили библиотеки **до** игровых, чтобы игровые правила
выигрывали при равной специфичности:

```tsx
import '@gonreg/game-hud/styles.css';
import './styles/global.css';
import './styles/additions.css';
```

и обернуть `<App />`:

```tsx
import { HudProvider } from '@gonreg/game-hud';
import { hudAdapter } from '@/hud/adapter';

<TonConnectUIProvider manifestUrl={manifestUrl}>
  <HudProvider
    adapter={hudAdapter}
    config={{
      botUsername: 'jubb_app_bot',
      currency: 'TON',
      minBet: 0.1,
      maxBet: 100,
    }}
  >
    <App />
  </HudProvider>
</TonConnectUIProvider>
```

Значения `minBet` и `maxBet` заменить на найденные в шаге 2.

- [ ] **Step 4: Заменить компоненты в App.tsx**

В `F/App.tsx`:

- удалить импорты `@/components/BalanceChip`, `@/components/ProfileAvatarButton`,
  `@/components/SoundSettings`, `@/components/WalletSheet`,
  `@/components/profile/ProfileShell`; вместо них:
  ```tsx
  import {
    BalanceChip,
    ProfileAvatarButton,
    SoundSettings,
    ProfileShell,
    WalletSheet,
    useTelegramSafeArea,
  } from '@gonreg/game-hud';
  ```
- подписаться на баланс и передать его: `const balance = useGameStore((s) => s.balance)`,
  затем `<BalanceChip balance={balance} />`
- `<SoundSettings />` — передать пропсы управления звуком из `sound` и `uiStore`
- `<WalletSheet />` → `<WalletSheet open={walletSheetOpen} onClose={closeWalletSheet} />`,
  значения из `uiStore`
- блок ручной синхронизации safe-area (`F/App.tsx:210-240`) удалить целиком и
  заменить одним вызовом `useTelegramSafeArea()` — библиотека делает то же самое,
  включая фолбэк 88px. В `App.tsx` оставить только игровое: `tg.ready()`, `tg.expand()`,
  `requestFullscreen`, `disableVerticalSwipes`, `enableClosingConfirmation`,
  синхронизацию языка
- CSS-переменные `--tg-safe-area-inset-*`, на которые опирались игровые правила,
  библиотека больше не пишет. Найти их использования и перевести на `--hud-safe-*`:
  ```bash
  cd /Users/ivan/PhpStormProjects/fatman/frontend && grep -rn "tg-safe-area-inset\|tg-content-safe-area-inset" src/
  ```

- [ ] **Step 5: Удалить осиротевший код**

```bash
cd /Users/ivan/PhpStormProjects/fatman/frontend/src && \
  rm -rf components/profile && \
  rm -f components/WalletSheet.tsx components/BalanceChip.tsx \
        components/ProfileAvatarButton.tsx components/SoundSettings.tsx \
        store/profileStore.ts hooks/useProfileMe.ts hooks/useReferralLink.ts \
        styles/profile.css && \
  grep -rn "profileStore\|useProfileMe\|useReferralLink\|styles/profile.css\|components/profile" . \
  || echo "ссылок не осталось"
```
Expected: `ссылок не осталось`. Если что-то нашлось — заменить на импорт из
`@gonreg/game-hud`; для состояния кабинета это `useHudStore`.

- [ ] **Step 6: Собрать**

Run: `cd /Users/ivan/PhpStormProjects/fatman/frontend && npx tsc -b && npx vite build`
Expected: сборка проходит без ошибок.

- [ ] **Step 7: Коммит**

```bash
cd /Users/ivan/PhpStormProjects/fatman
git add -A frontend/src frontend/package.json
git commit -m "refactor(hud): перевод кабинета и HUD на @gonreg/game-hud"
```

---

### Task 26: Проверка в браузере и переход на git-URL

**Files:**
- Modify: `fatman/frontend/package.json`

- [ ] **Step 1: Поднять fatman**

Run: `cd /Users/ivan/PhpStormProjects/fatman/frontend && npm run dev`
Открыть выданный адрес.

- [ ] **Step 2: Пройти кабинет руками**

Проверить по списку и записать результат каждого пункта:

1. тап по баланс-пилюле открывает кошелёк — **исправленное поведение**, раньше
   оверлей не раскрывался
2. тап по аватару открывает хаб; видны имя, три баланса, меню
3. строка кошелька в меню показывает «подключён» ровно тогда, когда TonConnect
   подключён — **исправленное поведение**, раньше читалось пустое серверное поле
4. кошелёк: промо-карусель на месте — **новое**; работают депозит, привязка кошелька,
   вывод
5. история: список транзакций скроллится, следующая страница подгружается
6. рефералы: ссылка, копирование, список приглашённых
7. статистика: цифры и перцентили
8. лидерборд: переключение метрики и окна перезапрашивает список
9. уведомления: 11 переключателей, положение сохраняется
10. язык: переключение меняет тексты, `ur` разворачивает страницу в rtl
11. помощь: обращение отправляется, вложение прикрепляется
12. Terms / Privacy / Offer открываются и рендерят документ
13. кнопка «назад» с внутреннего экрана ведёт на хаб, с хаба закрывает оверлей
14. системная кнопка «назад» Telegram делает то же самое
15. в фуллскрине шапка кабинета не уезжает под хром Telegram

- [ ] **Step 3: Сверить с критериями приёмки**

Любое расхождение с продом, кроме трёх помеченных выше как исправленное или новое,
— баг библиотеки. Чинить в `game-hud`, а не в fatman: иначе следующие пять игр
получат тот же баг.

- [ ] **Step 4: Переключить зависимость на git-URL**

После того как репозиторий `Gonreg/game-hud` создан и тег `v0.1.0` запушен:

```bash
cd /Users/ivan/PhpStormProjects/fatman/frontend && \
  npm install "github:Gonreg/game-hud#v0.1.0" && \
  npx tsc -b && npx vite build
```
Expected: установка тянет пакет из git, срабатывает `prepare`, сборка проходит.

- [ ] **Step 5: Коммит**

```bash
cd /Users/ivan/PhpStormProjects/fatman
git add frontend/package.json frontend/package-lock.json
git commit -m "chore(hud): game-hud из git по тегу v0.1.0"
```

---

## Что осталось за пределами этапа 1

- `GameHistoryScreen` и метод адаптера `getGameHistory` — приезжают на этапе 3
  вместе с matreshka, у которой история раундов, а не гроссбух
- интеграции crash-race, matreshka, basketball, molot, scratch-game — по отдельной
  короткой спеке на игру, порядок и риски в разделе 9 спеки
