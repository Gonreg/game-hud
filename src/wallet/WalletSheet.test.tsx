import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { WalletSheet } from './WalletSheet';
import { renderWithHud } from '../test/renderWithHud';
import { makeFakeAdapter, makeFakeWallet } from '../test/fakeAdapter';

vi.mock('@tonconnect/ui-react', () => ({
  useTonAddress: () => 'EQUserWallet',
  useTonConnectUI: () => [{ openModal: vi.fn(), sendTransaction: vi.fn() }],
  TonConnectButton: () => <button type="button">TonConnect</button>,
}));

describe('WalletSheet', () => {
  it('закрытый ничего не рендерит и не дёргает getMe', () => {
    const adapter = makeFakeAdapter();
    const { container } = renderWithHud(<WalletSheet open={false} onClose={() => {}} />, {
      adapter,
    });
    expect(container).toBeEmptyDOMElement();
    expect(adapter.getMe).not.toHaveBeenCalled();
  });

  it('открытый показывает форму вывода', async () => {
    renderWithHud(<WalletSheet open onClose={() => {}} />);
    const tabs = await screen.findAllByRole('button', { name: /^withdraw$/i });
    await userEvent.click(tabs[0]);
    expect(await screen.findByPlaceholderText(/amount/i)).toBeInTheDocument();
  });

  it('закрывается по тапу вне панели', async () => {
    const onClose = vi.fn();
    const { container } = renderWithHud(<WalletSheet open onClose={onClose} />);
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
    await userEvent.click(container.querySelector('.hud-sheet-backdrop')!);
    expect(onClose).toHaveBeenCalled();
  });

  it('закрывается по Escape', async () => {
    const onClose = vi.fn();
    renderWithHud(<WalletSheet open onClose={onClose} />);
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalled();
  });

  it('шлёт вывод через адаптер', async () => {
    const adapter = makeFakeAdapter();
    renderWithHud(<WalletSheet open onClose={() => {}} />, { adapter });

    // Вкладка и кнопка отправки подписаны одинаково («Withdraw») — это
    // коллизия в самом словаре fatman, а не в разметке. Идём тем же путём,
    // что и игрок: сначала вкладка, потом кнопка внутри формы.
    const tabs = await screen.findAllByRole('button', { name: /^withdraw$/i });
    await userEvent.click(tabs[0]);

    const input = await screen.findByPlaceholderText(/amount/i);
    await userEvent.type(input, '2');

    const buttons = screen.getAllByRole('button', { name: /^withdraw$/i });
    await userEvent.click(buttons[buttons.length - 1]);
    await waitFor(() => expect(adapter.postWithdraw).toHaveBeenCalledWith(2, 'EQUserWallet'));
  });

  it('показывает переданный баланс вместо баланса из getMe', async () => {
    // FAKE_ME.balance = 12.5 — если бы приоритет был неверным, увидели бы его.
    const { container } = renderWithHud(<WalletSheet open onClose={() => {}} balance={999} />);
    await waitFor(() =>
      expect(container.querySelector('.hud-wallet-sheet-balance__value')).toHaveTextContent(
        '999.00',
      ),
    );
  });

  it('вывод доступен при подключённом TonConnect, если бэк не умеет привязку', async () => {
    const adapter = makeFakeAdapter(); // без postWalletLink
    renderWithHud(<WalletSheet open onClose={() => {}} />, { adapter });
    const tabs = await screen.findAllByRole('button', { name: /^withdraw$/i });
    await userEvent.click(tabs[0]);
    const buttons = screen.getAllByRole('button', { name: /^withdraw$/i });
    expect(buttons[buttons.length - 1]).not.toBeDisabled();
  });

  it('блокирует вывод и просит привязать кошелёк, если бэк умеет привязку, а она не сделана', async () => {
    const adapter = makeFakeAdapter({ postWalletLink: vi.fn(async () => {}) });
    renderWithHud(<WalletSheet open onClose={() => {}} />, { adapter });
    const tabs = await screen.findAllByRole('button', { name: /^withdraw$/i });
    await userEvent.click(tabs[0]);
    const buttons = screen.getAllByRole('button', { name: /^withdraw$/i });
    expect(buttons[buttons.length - 1]).toBeDisabled();
    expect(screen.getByText('Link a wallet first')).toBeInTheDocument();
  });

  describe('с мостом', () => {
    it('адрес берётся из моста, а не из TonConnect', async () => {
      // Мок '@tonconnect/ui-react' наверху файла всегда отдаёт 'EQUserWallet'.
      // Мост не подключён (адрес null) — вывод должен быть заблокирован, хотя
      // адаптер не умеет привязку (canWithdraw = Boolean(address) в этой ветке).
      const bridge = makeFakeWallet(null);
      const adapter = makeFakeAdapter(); // без postWalletLink
      renderWithHud(<WalletSheet open onClose={() => {}} />, { adapter, wallet: bridge });
      const tabs = await screen.findAllByRole('button', { name: /^withdraw$/i });
      await userEvent.click(tabs[0]);
      const buttons = screen.getAllByRole('button', { name: /^withdraw$/i });
      expect(buttons[buttons.length - 1]).toBeDisabled();
    });

    it('встроенная кнопка TonConnect не рендерится, вместо неё кнопка "Connect wallet"', async () => {
      const bridge = makeFakeWallet(null);
      renderWithHud(<WalletSheet open onClose={() => {}} />, { wallet: bridge });
      await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
      expect(screen.queryByRole('button', { name: 'TonConnect' })).not.toBeInTheDocument();
      await userEvent.click(screen.getByRole('button', { name: 'Connect wallet' }));
      expect(bridge.connect).toHaveBeenCalledTimes(1);
    });

    it('sendDeposit моста вызывается при пополнении с адресом и суммой из getDeposit()', async () => {
      const bridge = makeFakeWallet('EQBridgeWallet');
      const adapter = makeFakeAdapter();
      renderWithHud(<WalletSheet open onClose={() => {}} />, { adapter, wallet: bridge });
      // Вкладка «Deposit» открыта по умолчанию, сумма предзаполнена «1».
      await userEvent.click(await screen.findByRole('button', { name: /deposit 1 ton/i }));
      await waitFor(() =>
        expect(bridge.sendDeposit).toHaveBeenCalledWith('EQTestAddress', '1000000000', 'u1'),
      );
    });
  });
});
