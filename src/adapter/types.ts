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
