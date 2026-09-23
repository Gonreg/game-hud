import { screen, waitFor } from '@testing-library/react';
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

vi.mock('@tonconnect/ui-react', () => ({
  useTonAddress: () => 'EQUserWallet',
  useTonConnectUI: () => [{ openModal: vi.fn(), sendTransaction: vi.fn() }],
  TonConnectButton: () => <button type="button">TonConnect</button>,
}));

/**
 * Хост-стенд: валюта сессии любая, и при scale > 9 сервер кладёт рядом с
 * числом точную строку. Числа в фикстурах — то, что реально доезжает в JSON
 * (уже без хвоста), строки — правда. Экран обязан показать строку.
 */
const ETH = { currency: 'ETH', scale: 18 };
const E = '0.123456789012345678';
const N = Number(E);

describe('кабинет стенда: точные суммы ETH (scale 18)', () => {
  beforeEach(() => {
    useHudStore.setState({ ...useHudStore.getInitialState(), open: true, screen: 'hub' });
  });

  it('ProfileHub показывает три баланса до wei', async () => {
    const adapter = makeFakeAdapter({
      getMe: vi.fn(async () => ({
        ...FAKE_ME,
        balance: N,
        balanceStr: E,
        bonusBalance: 0.5,
        bonusBalanceStr: '0.500000000000000000',
        refBalance: 1e-18,
        refBalanceStr: '0.000000000000000001',
      })),
    });
    renderWithHud(<ProfileHub />, { adapter, config: ETH });
    expect(await screen.findByText(E)).toBeInTheDocument();
    expect(screen.getByText('0.50')).toBeInTheDocument();
    expect(screen.getByText('0.000000000000000001')).toBeInTheDocument();
  });

  it('StatsScreen печатает строки и знак «−» у сегодняшнего убытка', async () => {
    const adapter = makeFakeAdapter({
      getStats: vi.fn(async () => ({
        ...FAKE_STATS,
        totalWagered: N,
        totalWageredStr: E,
        totalWon: 1,
        totalWonStr: '1.000000000000000001',
        netProfit: -1e-18,
        netProfitStr: '-0.000000000000000001',
        avgBet: 0.01,
        avgBetStr: '0.010000000000000000',
        biggestWin: 2,
        biggestWinStr: '2.000000000000000007',
        biggestLoss: 3,
        biggestLossStr: '3.000000000000000003',
        todayProfit: -N,
        todayProfitStr: `-${E}`,
      })),
    });
    const { container } = renderWithHud(<StatsScreen />, { adapter, config: ETH });
    await waitFor(() => expect(container.textContent).toContain(`${E} ETH`));
    const text = container.textContent!;
    expect(text).toContain('1.000000000000000001 ETH');
    expect(text).toContain('-0.000000000000000001 ETH');
    expect(text).toContain('0.01 ETH');
    expect(text).toContain('+2.000000000000000007 ETH');
    expect(text).toContain('−3.000000000000000003 ETH');
    // Знак рисует экран, из строки он снят — без двойного минуса.
    expect(text).toContain(`−${E} ETH`);
    expect(text).not.toContain('−-');
  });

  it('GameHistoryScreen считает разность в bigint: выигрыш в 1 wei — выигрыш', async () => {
    const adapter = makeFakeAdapter({
      getGameHistory: vi.fn(async () => [
        {
          ...FAKE_ROUND,
          bet: 1,
          betStr: '1.000000000000000001',
          payout: 1,
          payoutStr: '1.000000000000000002',
        },
      ]),
    });
    const { container } = renderWithHud(<GameHistoryScreen />, { adapter, config: ETH });
    // В double эти ставка и выплата равны: 1 − 1 = 0, строка рисовалась бы серым нулём.
    const hint = await waitFor(() => {
      const el = container.querySelector<HTMLElement>('.hud-profile-list__hint');
      expect(el?.textContent).toBe('+0.000000000000000001');
      return el!;
    });
    expect(hint.style.color).toBe('rgb(45, 212, 191)');
  });

  it('GameHistoryScreen: проигрыш со строками — со знаком и красный', async () => {
    const adapter = makeFakeAdapter({
      getGameHistory: vi.fn(async () => [
        { ...FAKE_ROUND, bet: N, betStr: E, payout: 0, payoutStr: '0.000000000000000000' },
      ]),
    });
    const { container } = renderWithHud(<GameHistoryScreen />, { adapter, config: ETH });
    await waitFor(() =>
      expect(container.querySelector('.hud-profile-list__hint')?.textContent).toBe(`-${E}`),
    );
    expect(container.querySelector<HTMLElement>('.hud-profile-list__hint')!.style.color).toBe(
      'rgb(255, 122, 89)',
    );
  });

  it('HistoryScreen печатает проводку до wei', async () => {
    const adapter = makeFakeAdapter({
      getTransactions: vi.fn(async () => ({
        items: [{ ...FAKE_TX, amount: -N, amountStr: `-${E}` }],
        nextCursor: null,
      })),
    });
    const { container } = renderWithHud(<HistoryScreen />, { adapter, config: ETH });
    await waitFor(() => expect(container.textContent).toContain(`-${E}`));
  });

  it('ReferralsScreen печатает три суммы строками', async () => {
    const adapter = makeFakeAdapter({
      getReferrals: vi.fn(async () => ({
        ...FAKE_REFERRALS,
        refBalance: N,
        refBalanceStr: E,
        totalEarned: 5,
        totalEarnedStr: '5.000000000000000005',
        invitees: [
          { ...FAKE_REFERRALS.invitees[0]!, earnedFromThem: 1e-18, earnedFromThemStr: '0.000000000000000001' },
        ],
      })),
    });
    const { container } = renderWithHud(<ReferralsScreen />, { adapter, config: ETH });
    await waitFor(() => expect(container.textContent).toContain(`${E} ETH`));
    expect(container.textContent).toContain('5.000000000000000005 ETH');
    expect(container.textContent).toContain('+0.000000000000000001 ETH');
  });

  it('LeaderboardScreen печатает профит, оборот и убыток строками', async () => {
    const adapter = makeFakeAdapter({
      getLeaderboard: vi.fn(async () => ({
        ...FAKE_LEADERBOARD,
        top: [
          {
            ...FAKE_LEADERBOARD.top[0]!,
            profit: N,
            profitStr: E,
            turnover: 10,
            turnoverStr: '10.000000000000000001',
            loss: 2,
            lossStr: '2.000000000000000002',
          },
        ],
      })),
    });
    const { container } = renderWithHud(<LeaderboardScreen />, { adapter, config: ETH });
    await waitFor(() => expect(container.textContent).toContain(`+${E} ETH`));
    const select = container.querySelector('select')!;
    await userEvent.selectOptions(select, 'turnover');
    await waitFor(() => expect(container.textContent).toContain('10.000000000000000001 ETH'));
    await userEvent.selectOptions(select, 'loss');
    await waitFor(() => expect(container.textContent).toContain('-2.000000000000000002 ETH'));
  });

  it('WalletScreen: остаток отыгрыша и выводы до wei', async () => {
    useHudStore.setState({ ...useHudStore.getInitialState(), open: true, screen: 'wallet' });
    const adapter = makeFakeAdapter({
      getMe: vi.fn(async () => ({ ...FAKE_ME, wagerRemaining: N, wagerRemainingStr: E })),
      getWithdrawals: vi.fn(async () => [
        { id: 'w1', amount: 1, amountStr: '1.000000000000000009', status: 'done', address: null },
      ]),
    });
    const { container } = renderWithHud(<WalletScreen />, { adapter, config: ETH });
    await waitFor(() => expect(container.textContent).toContain(E));
    await waitFor(() => expect(container.textContent).toContain('1.000000000000000009'));
  });

  it('WalletSheet: баланс из me — строкой', async () => {
    const adapter = makeFakeAdapter({
      getMe: vi.fn(async () => ({ ...FAKE_ME, balance: N, balanceStr: E })),
    });
    const { baseElement } = renderWithHud(<WalletSheet open onClose={() => {}} />, {
      adapter,
      config: ETH,
    });
    await waitFor(() =>
      expect(baseElement.querySelector('.hud-wallet-sheet-balance__value')?.textContent).toBe(`${E} ETH`),
    );
  });
});

describe('кабинет стенда: BTC (scale 8) — строк нет, число точно', () => {
  it('StatsScreen печатает все значимые знаки, а не сотые', async () => {
    const adapter = makeFakeAdapter({
      getStats: vi.fn(async () => ({ ...FAKE_STATS, totalWagered: 0.00012345, avgBet: 0.5 })),
    });
    const { container } = renderWithHud(<StatsScreen />, {
      adapter,
      config: { currency: 'BTC', scale: 8 },
    });
    await waitFor(() => expect(container.textContent).toContain('0.00012345 BTC'));
    expect(container.textContent).toContain('0.50 BTC');
  });

  it('GameHistoryScreen без строк считает по числам и округляет до scale', async () => {
    const adapter = makeFakeAdapter({
      getGameHistory: vi.fn(async () => [{ ...FAKE_ROUND, bet: 0.1, payout: 0.30000001 }]),
    });
    const { container } = renderWithHud(<GameHistoryScreen />, {
      adapter,
      config: { currency: 'BTC', scale: 8 },
    });
    await waitFor(() =>
      expect(container.querySelector('.hud-profile-list__hint')?.textContent).toBe('+0.20000001'),
    );
  });
});
