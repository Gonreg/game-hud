import { waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GameHistoryScreen } from './GameHistoryScreen';
import { HistoryScreen } from './HistoryScreen';
import { LeaderboardScreen } from './LeaderboardScreen';
import { ProfileHub } from './ProfileHub';
import { ReferralsScreen } from './ReferralsScreen';
import { StatsScreen } from './StatsScreen';
import { WalletScreen } from './WalletScreen';
import { WalletSheet } from '../wallet/WalletSheet';
import { useHudStore } from '../store/hudStore';
import { renderWithHud } from '../test/renderWithHud';
import {
  FAKE_LEADERBOARD,
  FAKE_ME,
  FAKE_REFERRALS,
  FAKE_ROUND,
  FAKE_STATS,
  FAKE_TX,
  makeFakeAdapter,
} from '../test/fakeAdapter';
import type { HudAdapter } from '../adapter/types';

vi.mock('@tonconnect/ui-react', () => ({
  useTonAddress: () => 'EQUserWallet',
  useTonConnectUI: () => [{ openModal: vi.fn(), sendTransaction: vi.fn() }],
  TonConnectButton: () => <button type="button">TonConnect</button>,
}));

/**
 * Закрепка для пяти Телеграм-игр: их адаптеры не знают ни точных строк, ни
 * `scale`, и кабинет обязан рисовать им суммы БАЙТ В БАЙТ как в v1.3.0.
 * Снимки записаны на коде v1.3.0, до появления точных сумм, — поэтому любое
 * расхождение здесь значит, что новая логика протекла в старый путь.
 *
 * Суммы нарочно неудобные: лишние знаки (округление до сотых), половинки,
 * почти-ноль с минусом, тысячи — всё, на чём новая ветка форматтера могла бы
 * тихо поменять вывод. Обновлять снимки можно только осознанно, вместе с
 * решением поменять вид сумм у всех пяти игр разом.
 */
const ODD = {
  me: { ...FAKE_ME, balance: 1234.567, bonusBalance: 0.005, refBalance: 0.123456789, wagerRemaining: 7.891 },
  stats: {
    ...FAKE_STATS,
    totalWagered: 1000000.129,
    totalWon: 0.123456789,
    netProfit: -0.001,
    avgBet: 2.345,
    biggestWin: 30.999,
    biggestLoss: 12.004,
    todayProfit: -3.456,
  },
  rounds: [
    { ...FAKE_ROUND, id: 'a', bet: 0.1, payout: 0.3 },
    { ...FAKE_ROUND, id: 'b', bet: 1.123456789, payout: 0 },
    { ...FAKE_ROUND, id: 'c', bet: 2, payout: 2 },
  ],
  txs: [
    { ...FAKE_TX, id: 'x', amount: 1234.567 },
    { ...FAKE_TX, id: 'y', amount: -0.123456789 },
  ],
  referrals: {
    ...FAKE_REFERRALS,
    refBalance: 0.123456789,
    totalEarned: 1234.5,
    invitees: [{ ...FAKE_REFERRALS.invitees[0]!, earnedFromThem: 0.005 }],
  },
  leaderboard: {
    ...FAKE_LEADERBOARD,
    top: [
      { ...FAKE_LEADERBOARD.top[0]!, profit: -12.345, turnover: 1000.129, loss: 0.123456789 },
    ],
  },
};

function oddAdapter(): HudAdapter {
  return makeFakeAdapter({
    getMe: vi.fn(async () => ODD.me),
    getStats: vi.fn(async () => ODD.stats),
    getGameHistory: vi.fn(async () => ODD.rounds),
    getTransactions: vi.fn(async () => ({ items: ODD.txs, nextCursor: null })),
    getReferrals: vi.fn(async () => ODD.referrals),
    getLeaderboard: vi.fn(async () => ODD.leaderboard),
    getWithdrawals: vi.fn(async () => [
      { id: 'w1', amount: 0.123456789, status: 'done', address: null },
    ]),
  });
}

describe('суммы пяти Телеграм-игр — байт в байт как в v1.3.0', () => {
  beforeEach(() => {
    useHudStore.setState({ ...useHudStore.getInitialState(), open: true, screen: 'hub' });
  });

  it('ProfileHub', async () => {
    const { container } = renderWithHud(<ProfileHub />, { adapter: oddAdapter() });
    await waitFor(() => expect(container.textContent).toContain('1,234.57'));
    expect(container.innerHTML).toMatchSnapshot();
  });

  it('StatsScreen', async () => {
    const { container } = renderWithHud(<StatsScreen />, { adapter: oddAdapter() });
    await waitFor(() => expect(container.textContent).toContain('1,000,000.13'));
    expect(container.innerHTML).toMatchSnapshot();
  });

  it('GameHistoryScreen', async () => {
    const { container } = renderWithHud(<GameHistoryScreen />, { adapter: oddAdapter() });
    await waitFor(() => expect(container.textContent).toContain('0.20'));
    expect(container.innerHTML).toMatchSnapshot();
  });

  it('HistoryScreen', async () => {
    const { container } = renderWithHud(<HistoryScreen />, { adapter: oddAdapter() });
    await waitFor(() => expect(container.textContent).toContain('1,234.57'));
    expect(container.innerHTML).toMatchSnapshot();
  });

  it('ReferralsScreen', async () => {
    const { container } = renderWithHud(<ReferralsScreen />, { adapter: oddAdapter() });
    await waitFor(() => expect(container.textContent).toContain('1,234.50'));
    expect(container.innerHTML).toMatchSnapshot();
  });

  it('LeaderboardScreen во всех денежных режимах', async () => {
    const { container } = renderWithHud(<LeaderboardScreen />, { adapter: oddAdapter() });
    await waitFor(() => expect(container.textContent).toContain('-12.35'));
    const html = [container.innerHTML];
    const select = container.querySelector('select')!;
    for (const [mode, text] of [['turnover', '1,000.13'], ['loss', '-0.12']] as const) {
      await userEvent.selectOptions(select, mode);
      await waitFor(() => expect(container.textContent).toContain(text));
      html.push(container.innerHTML);
    }
    expect(html).toMatchSnapshot();
  });

  it('WalletScreen', async () => {
    useHudStore.setState({ ...useHudStore.getInitialState(), open: true, screen: 'wallet' });
    const { container } = renderWithHud(<WalletScreen />, { adapter: oddAdapter() });
    await waitFor(() => expect(container.textContent).toContain('7.89'));
    await waitFor(() => expect(container.querySelector('.hud-wallet-withdrawals__row')).not.toBeNull());
    expect(container.innerHTML).toMatchSnapshot();
  });

  it('WalletSheet', async () => {
    const { baseElement } = renderWithHud(<WalletSheet open onClose={() => {}} />, {
      adapter: oddAdapter(),
    });
    await waitFor(() => expect(baseElement.textContent).toContain('1,234.57'));
    expect(baseElement.querySelector('.hud-wallet-sheet-balance')!.outerHTML).toMatchSnapshot();
  });
});
