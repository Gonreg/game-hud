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

  // Клиент проверяет только то, что проверяют обе исходные реализации: сумма
  // должна быть положительным числом. Лимита по балансу здесь СОЗНАТЕЛЬНО нет —
  // сколько реально можно вывести, знает сервер (бонусный баланс не выводится,
  // возможны комиссии), и клиентский лимит рисковал бы заблокировать законный
  // вывод. Пусть отказывает сервер.
  it('не отправляет вывод при неположительной сумме', async () => {
    const adapter = makeFakeAdapter();
    renderWithHud(<WalletScreen />, { adapter });
    const input = await screen.findByPlaceholderText(/amount/i);
    await userEvent.type(input, '0');
    await userEvent.click(screen.getByRole('button', { name: /withdraw/i }));
    expect(adapter.postWithdraw).not.toHaveBeenCalled();
  });

  it('прячет список выводов, если адаптер его не умеет', async () => {
    const { container } = renderWithHud(<WalletScreen />, { adapter: makeFakeAdapter() });
    // Ждём отрисовки формы вывода — иначе отсутствие блока ничего не доказывает.
    // Адрес депозита для этого не годится: ни fatman, ни matreshka его не
    // показывают, он уходит прямо в TonConnect.
    await screen.findByPlaceholderText(/amount/i);
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

  it('не рисует дату, когда бэк её не отдал', async () => {
    // У molot обработчик не выбирает колонку created_at из базы вовсе.
    // Показать «Invalid Date» в каждой строке было бы хуже, чем не показать.
    const adapter = makeFakeAdapter({
      getWithdrawals: vi.fn(async () => [
        { id: 'w1', amount: 2, status: 'pending', address: 'EQx', createdAt: undefined },
      ]),
    });
    const { container } = renderWithHud(<WalletScreen />, { adapter });
    await waitFor(() =>
      expect(container.querySelector('.hud-wallet-withdrawals')).toBeInTheDocument(),
    );
    expect(container.textContent).not.toMatch(/Invalid Date/);
  });

  it('не рисует дату, когда она неразбираемая', async () => {
    const adapter = makeFakeAdapter({
      getWithdrawals: vi.fn(async () => [
        { id: 'w1', amount: 2, status: 'pending', address: 'EQx', createdAt: 'мусор' },
      ]),
    });
    const { container } = renderWithHud(<WalletScreen />, { adapter });
    await waitFor(() =>
      expect(container.querySelector('.hud-wallet-withdrawals')).toBeInTheDocument(),
    );
    expect(container.textContent).not.toMatch(/Invalid Date/);
  });

  it('вывод доступен при подключённом TonConnect, если бэк не умеет привязку', async () => {
    const adapter = makeFakeAdapter(); // без postWalletLink
    renderWithHud(<WalletScreen />, { adapter });
    await screen.findByPlaceholderText(/amount/i);
    expect(screen.getByRole('button', { name: /withdraw/i })).not.toBeDisabled();
  });

  it('блокирует вывод и просит привязать кошелёк, если бэк умеет привязку, а она не сделана', async () => {
    const adapter = makeFakeAdapter({ postWalletLink: vi.fn(async () => {}) });
    renderWithHud(<WalletScreen />, { adapter });
    await screen.findByPlaceholderText(/amount/i);
    expect(screen.getByRole('button', { name: /withdraw/i })).toBeDisabled();
    expect(screen.getByText('Link a wallet first')).toBeInTheDocument();
  });
});
