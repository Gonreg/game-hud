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
  totalEarned: 1.25,
  ratePercent: 10,
  refBalance: 1.25,
  invitees: [
    {
      id: 'i1',
      firstName: 'Ann',
      username: 'ann',
      joinedAt: '2026-07-01T10:00:00.000Z',
      earnedFromThem: 1,
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

/** Сколько переключателей в FAKE_PREFS включено — тест уведомлений сверяется с
 *  этим числом, а не с захардкоженной четвёркой: изменится фикстура — число
 *  пересчитается само, вместо того чтобы тест начал молча врать. */
export const FAKE_PREFS_ENABLED_COUNT = Object.values(FAKE_PREFS).filter(Boolean).length;

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
