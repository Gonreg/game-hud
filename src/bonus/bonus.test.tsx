import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { BonusOverview } from '../adapter/types';
import { useHudStore } from '../store/hudStore';
import { renderWithHud } from '../test/renderWithHud';
import { FAKE_ME, makeFakeAdapter } from '../test/fakeAdapter';
import { BonusButton } from './BonusButton';
import { BonusSheet } from './BonusSheet';
import { PromoCarousel } from './PromoCarousel';
import { ProfileHub } from '../profile/ProfileHub';
import { WalletScreen } from '../profile/WalletScreen';

vi.mock('@tonconnect/ui-react', () => ({
  useTonAddress: () => '',
  useTonConnectUI: () => [{ openModal: vi.fn(), sendTransaction: vi.fn() }],
  TonConnectButton: () => null,
}));

const FULL: BonusOverview = {
  freeSpins: { left: 7, total: 10, stake: 1, expiresAt: '2026-10-14T12:00:00Z', wagerMultiplier: 40 },
  depositBonus: { percent: 100, wagerMultiplier: 30 },
  wagering: { remaining: 30, total: 72, held: 1.8, hasDeposit: false, expiresAt: '2026-10-14T12:00:00Z' },
  referral: { ratePercent: 10 },
  expiryDays: 14,
};

const withBonuses = (b: BonusOverview) => makeFakeAdapter({ getBonuses: vi.fn(async () => b) });

describe('BonusButton', () => {
  beforeEach(() => useHudStore.setState(useHudStore.getInitialState()));

  it('у бэка без getBonuses кнопки нет', async () => {
    const { container } = renderWithHud(<BonusButton />);
    await act(async () => {}); // пустой запрос бонусов успевает вернуться
    expect(container).toBeEmptyDOMElement();
  });

  it('показывает остаток фриспинов бейджем и открывает шит', async () => {
    renderWithHud(<BonusButton />, { adapter: withBonuses(FULL) });
    const btn = await screen.findByRole('button', { name: 'Bonuses: 7 free spins left' });
    expect(within(btn).getByText('7')).toHaveClass('hud-bonus-chip__badge');
    expect(btn).toHaveClass('hud-bonus-chip--hot');
    await userEvent.click(btn);
    expect(useHudStore.getState().bonusOpen).toBe(true);
  });

  it('без фриспинов — просто «Бонусы», без бейджа', async () => {
    renderWithHud(<BonusButton />, {
      adapter: withBonuses({ ...FULL, freeSpins: { ...FULL.freeSpins!, left: 0 } }),
    });
    const btn = await screen.findByRole('button', { name: 'Bonuses' });
    await waitFor(() => expect(btn.querySelector('.hud-bonus-chip__badge')).toBeNull());
  });

  it('перезапрашивает бонусы, когда игра поднимает bumpBonuses', async () => {
    const adapter = withBonuses(FULL);
    renderWithHud(<BonusButton />, { adapter });
    await screen.findByRole('button', { name: /7 free spins/ });
    act(() => useHudStore.getState().bumpBonuses());
    await waitFor(() => expect(adapter.getBonuses).toHaveBeenCalledTimes(2));
  });
});

describe('BonusSheet', () => {
  beforeEach(() => useHudStore.setState({ ...useHudStore.getInitialState(), bonusOpen: true }));

  it('закрыт — ничего не рисует и адаптер не дёргает', () => {
    useHudStore.setState({ bonusOpen: false });
    const adapter = withBonuses(FULL);
    renderWithHud(<BonusSheet />, { adapter });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(adapter.getBonuses).not.toHaveBeenCalled();
  });

  it('раскладывает все активные механики по разделам', async () => {
    renderWithHud(<BonusSheet />, { adapter: withBonuses(FULL) });
    const dialog = await screen.findByRole('dialog', { name: 'Bonuses' });
    await within(dialog).findByText('7 of 10 left');
    expect(within(dialog).getByText('Free spin stake — 1.00 GRAM')).toBeInTheDocument();
    expect(within(dialog).getByText(/×40 wagering and your first top-up/)).toBeInTheDocument();
    expect(within(dialog).getByText('+100% on top-ups')).toBeInTheDocument();
    expect(within(dialog).getByText(/turnover of ×30/)).toBeInTheDocument();
    const bar = within(dialog).getByRole('progressbar', { name: 'Wagering' });
    expect(bar).toHaveAttribute('aria-valuenow', '58'); // (72 − 30) / 72
    expect(within(dialog).getByText('30.00 left to wager')).toBeInTheDocument();
    expect(
      within(dialog).getByText(/At least one top-up with real money is required/),
    ).toBeInTheDocument();
    expect(within(dialog).getByText(/get 10% of their losses/)).toBeInTheDocument();
  });

  it('отыграно без депозита — зовёт пополнить и ведёт в кассу', async () => {
    renderWithHud(<BonusSheet />, {
      adapter: withBonuses({ wagering: { remaining: 0, total: 0, held: 0, earned: 1.8, hasDeposit: false } }),
    });
    await screen.findByText('Wagered, awaiting a top-up: 1.80');
    expect(screen.getByText(/Top up your balance and it becomes withdrawable/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Top up' }));
    expect(useHudStore.getState()).toMatchObject({
      bonusOpen: false,
      open: true,
      screen: 'wallet',
      walletFocus: 'deposit',
    });
  });

  it('неактивных механик нет: потраченные фриспины и пустой отыгрыш молчат', async () => {
    renderWithHud(<BonusSheet />, {
      adapter: withBonuses({
        freeSpins: { ...FULL.freeSpins!, left: 0 },
        wagering: { remaining: 0, total: 0, held: 0, hasDeposit: true },
      }),
    });
    await screen.findByText('No active bonuses right now');
    expect(screen.queryByText('Free spins')).toBeNull();
    expect(screen.queryByRole('progressbar')).toBeNull();
  });

  it('реферальная кнопка открывает экран друзей в кабинете', async () => {
    renderWithHud(<BonusSheet />, { adapter: withBonuses(FULL) });
    await userEvent.click(await screen.findByRole('button', { name: 'Invite friends' }));
    expect(useHudStore.getState()).toMatchObject({ bonusOpen: false, open: true, screen: 'referrals' });
  });

  it('«?» показывает условия, собранные из включённых механик', async () => {
    renderWithHud(<BonusSheet />, { adapter: withBonuses(FULL) });
    await screen.findByText('7 of 10 left');
    await userEvent.click(screen.getByRole('button', { name: 'info' }));
    const rules = screen.getAllByRole('dialog').at(-1)!;
    expect(rules).toHaveTextContent('10 free bets of 1.00 GRAM');
    expect(rules).toHaveTextContent('×40 the winnings');
    expect(rules).toHaveTextContent('+100% top-up bonus needs turnover of ×30');
    expect(rules).toHaveTextContent('at least one top-up with real money');
    expect(rules).toHaveTextContent('14 days after they are credited');
  });
});

describe('PromoCarousel', () => {
  beforeEach(() =>
    useHudStore.setState({ ...useHudStore.getInitialState(), open: true, screen: 'hub' }),
  );

  it('у бэка без getBonuses карусели нет', async () => {
    const { container } = renderWithHud(<PromoCarousel />);
    await act(async () => {}); // пустой запрос бонусов успевает вернуться
    expect(container).toBeEmptyDOMElement();
  });

  it('карточка на каждую активную акцию, точки и переходы', async () => {
    renderWithHud(<PromoCarousel />, { adapter: withBonuses(FULL) });
    const region = await screen.findByRole('region', { name: 'Promotions' });
    const cards = region.querySelectorAll<HTMLButtonElement>('.hud-promo-card');
    expect([...cards].map((c) => c.dataset.track)).toEqual([
      'promo_spins',
      'promo_deposit',
      'promo_referral',
    ]);
    expect(cards[0]).toHaveAccessibleName(
      'Free spins: 7. Free bets of 1.00 GRAM — tap to see the terms',
    );

    const dots = within(region).getAllByRole('button', { name: /Slide \d of 3/ });
    expect(dots).toHaveLength(3);
    expect(dots[0]).toHaveAttribute('aria-current', 'true');
    await userEvent.click(dots[2]);
    expect(dots[2]).toHaveAttribute('aria-current', 'true');
    expect(dots[0]).not.toHaveAttribute('aria-current');

    await userEvent.click(cards[0]);
    expect(useHudStore.getState().bonusOpen).toBe(true);
    await userEvent.click(cards[2]);
    expect(useHudStore.getState().screen).toBe('referrals');
    await userEvent.click(cards[1]);
    expect(useHudStore.getState()).toMatchObject({ screen: 'wallet', walletFocus: 'deposit' });
  });

  it('одна акция — без точек', async () => {
    renderWithHud(<PromoCarousel />, { adapter: withBonuses({ referral: { ratePercent: 10 } }) });
    await screen.findByText('10% from friends');
    expect(screen.queryByRole('button', { name: /Slide/ })).toBeNull();
  });

  it('в кабинете стоит над строкой балансов', async () => {
    const { container } = renderWithHud(<ProfileHub />, { adapter: withBonuses(FULL) });
    await screen.findByRole('region', { name: 'Promotions' });
    const carousel = container.querySelector('.hud-promo-carousel')!;
    const balances = container.querySelector('.hud-profile-hub__balances')!;
    expect(
      carousel.compareDocumentPosition(balances) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });
});

describe('касса и новые условия', () => {
  beforeEach(() =>
    useHudStore.setState({ ...useHudStore.getInitialState(), open: true, screen: 'wallet' }),
  );

  it('«?» у бонуса — собранные условия; отыгравшему без депозита — подсказка', async () => {
    const adapter = withBonuses(FULL);
    adapter.getMe = vi.fn(async () => ({
      ...FAKE_ME,
      bonusBalance: 1.8,
      wagerRemaining: 0,
      hasDeposit: false,
    }));
    renderWithHud(<WalletScreen />, { adapter });
    await screen.findByText('Wagering complete — top up your balance to withdraw the bonus');
    await waitFor(() => expect(adapter.getBonuses).toHaveBeenCalled());
    const promo = document.querySelector<HTMLElement>('.hud-profile-promo')!;
    await userEvent.click(within(promo).getByRole('button', { name: 'info' }));
    await waitFor(() =>
      expect(screen.getAllByRole('dialog').at(-1)).toHaveTextContent(
        'at least one top-up with real money',
      ),
    );
  });

  it('бэк без правила депозита — подсказки нет', async () => {
    const adapter = makeFakeAdapter({
      getMe: vi.fn(async () => ({ ...FAKE_ME, bonusBalance: 1.8, wagerRemaining: 0 })),
    });
    renderWithHud(<WalletScreen />, { adapter });
    await waitFor(() => expect(adapter.getMe).toHaveBeenCalled());
    expect(screen.queryByText(/top up your balance to withdraw the bonus/)).toBeNull();
  });
});

describe('1.5.1: заработанный бонус, минимальный депозит, реальный процент друзей', () => {
  beforeEach(() =>
    useHudStore.setState({ ...useHudStore.getInitialState(), open: true, screen: 'hub', bonusOpen: true }),
  );

  const EARNED: BonusOverview = {
    wagering: { remaining: 60, total: 72, held: 1.8, earned: 5, hasDeposit: false },
    minQualifyingDeposit: 5,
    expiryDays: 14,
  };

  it('заработанное показано отдельно от текущего отыгрыша и зовёт пополнить от минимума', async () => {
    renderWithHud(<BonusSheet />, { adapter: withBonuses(EARNED) });
    await screen.findByText('Wagered, awaiting a top-up: 5.00');
    expect(screen.getByText(/Top up at least 5.00 GRAM and it becomes withdrawable/)).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '16'); // (72 − 60) / 72
    expect(screen.getByText('60.00 left to wager')).toBeInTheDocument();
  });

  it('только заработанное, без активного отыгрыша — полосы нет, раздел есть', async () => {
    renderWithHud(<BonusSheet />, {
      adapter: withBonuses({ ...EARNED, wagering: { remaining: 0, total: 0, held: 0, earned: 5, hasDeposit: false } }),
    });
    await screen.findByText('Wagered, awaiting a top-up: 5.00');
    expect(screen.queryByRole('progressbar')).toBeNull();
  });

  it('условия называют минимальный депозит и говорят про ранее выданные подарки', async () => {
    renderWithHud(<BonusSheet />, { adapter: withBonuses(EARNED) });
    await screen.findByText('Wagered, awaiting a top-up: 5.00');
    await userEvent.click(screen.getByRole('button', { name: 'info' }));
    const rules = screen.getAllByRole('dialog').at(-1)!;
    expect(rules).toHaveTextContent('at least one top-up of 5.00 GRAM or more');
    expect(rules).toHaveTextContent('including gifts received earlier');
  });

  it('подсказка реферального пункта — реальный процент из getBonuses, а не «up to 30%»', async () => {
    renderWithHud(<ProfileHub />, { adapter: withBonuses({ referral: { ratePercent: 10 } }) });
    await screen.findByText('10% of losses');
    expect(screen.queryByText('up to 30%')).toBeNull();
  });

  it('касса: подсказка про депозит — по заработанному, с минимумом', async () => {
    useHudStore.setState({ screen: 'wallet', bonusOpen: false });
    const adapter = withBonuses(EARNED);
    adapter.getMe = vi.fn(async () => ({ ...FAKE_ME, bonusBalance: 6.8, wagerRemaining: 60, hasDeposit: false }));
    renderWithHud(<WalletScreen />, { adapter });
    await screen.findByText('5.00 wagered — top up at least 5.00 GRAM to withdraw it');
  });
});
