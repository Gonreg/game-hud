import { vi } from 'vitest';
import type { HudAdapter } from '../adapter/types';
import {
  FAKE_DEPOSIT,
  FAKE_LEADERBOARD,
  FAKE_ME,
  FAKE_PERCENTILES,
  FAKE_PREFS,
  FAKE_REFERRALS,
  FAKE_STATS,
  FAKE_TX,
} from './fixtures';

export * from './fixtures';

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
    postWithdraw: vi.fn(async () => ({ id: 'wd-12345678', status: 'pending' })),
    postSupport: vi.fn(async () => ({ ticketId: 'TK-42', filesCount: 0 })),
    ...over,
  };
}

/**
 * Ломает восемь читающих методов — для проверки экрана загрузки и ошибки.
 * Пишущие (`postWithdraw`, `postSupport`, `putNotificationPrefs`) остаются
 * рабочими: у каждого экрана своя обработка ошибки записи со своим текстом,
 * общего выключателя для них быть не может. Чтобы проверить ошибку записи,
 * переопредели конкретный метод: `makeFakeAdapter({ postWithdraw: ... })`.
 */
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
