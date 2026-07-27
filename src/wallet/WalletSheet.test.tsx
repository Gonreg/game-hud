import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { WalletSheet } from './WalletSheet';
import { renderWithHud } from '../test/renderWithHud';
import { makeFakeAdapter } from '../test/fakeAdapter';

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
});
