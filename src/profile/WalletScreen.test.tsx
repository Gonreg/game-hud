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
    useHudStore.setState({ ...useHudStore.getInitialState(), open: true, screen: 'wallet' });
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
