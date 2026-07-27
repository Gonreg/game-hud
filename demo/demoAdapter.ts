import type { HudAdapter } from '../src/adapter/types';
import {
  FAKE_DEPOSIT,
  FAKE_LEADERBOARD,
  FAKE_ME,
  FAKE_PERCENTILES,
  FAKE_PREFS,
  FAKE_REFERRALS,
  FAKE_STATS,
  FAKE_TX,
} from '../src/test/fixtures';

/**
 * Адаптер для демо-страницы. Отдельный от makeFakeAdapter, потому что тот
 * импортирует vitest, а vitest падает при импорте вне тестового раннера —
 * демо от этого не рендерилось вовсе.
 */
export const demoAdapter: HudAdapter = {
  getMe: async () => FAKE_ME,
  getStats: async () => FAKE_STATS,
  getPercentiles: async () => FAKE_PERCENTILES,
  getLeaderboard: async () => FAKE_LEADERBOARD,
  getReferrals: async () => FAKE_REFERRALS,
  getTransactions: async () => ({ items: [FAKE_TX], nextCursor: null }),
  getNotificationPrefs: async () => FAKE_PREFS,
  putNotificationPrefs: async (p) => ({ ...FAKE_PREFS, ...p }),
  getDeposit: async () => FAKE_DEPOSIT,
  postWithdraw: async () => ({ id: 'wd-12345678', status: 'pending' }),
  postSupport: async () => ({ ticketId: 'TK-42', filesCount: 0 }),
};
