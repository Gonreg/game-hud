import type {
  Deposit,
  GameRound,
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
  // Проценты, а не доля: экран рисует winrate.toFixed(1) + '%', то есть бэк
  // отдаёт значение уже в процентах. С долей 0.55 экран показал бы «0.6%».
  winrate: 55,
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

// Доли, а не проценты — см. комментарий над Percentiles в adapter/types.
// winrate намеренно не 0.55: иначе «лучше 55%» столкнулось бы в запросах по
// тексту с самим винрейтом «55.0%» из FAKE_STATS.
export const FAKE_PERCENTILES: Percentiles = {
  rounds: 0.6,
  bestMult: 0.8,
  winrate: 0.72,
  profit: 0.7,
  avgBet: 0.4,
};

export const FAKE_REFERRALS: Referrals = {
  refCode: 'ABC123',
  refLink: 'https://t.me/test_bot?start=ABC123',
  invitedCount: 2,
  // Намеренно отличается от refBalance: одинаковые значения делали бы запрос
  // getByText неоднозначным и вынуждали бы изгибать разметку под тест.
  totalEarned: 4.75,
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

export const FAKE_ROUND: GameRound = {
  id: 'r1',
  bet: 2,
  payout: 10,
  coef: 5,
  status: 'cashed',
  createdAt: '2026-07-20T09:00:00.000Z',
};
