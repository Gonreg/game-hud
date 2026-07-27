import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { BetAmountInput } from './BetAmountInput';
import { renderWithHud } from '../test/renderWithHud';

describe('BetAmountInput', () => {
  it('показывает сумму единым форматтером', () => {
    renderWithHud(<BetAmountInput value={3} onChange={() => {}} min={0.1} max={100} balance={50} />);
    expect(screen.getByText('3.00')).toBeInTheDocument();
  });

  it('плюс и минус сообщают новую сумму наверх', async () => {
    const onChange = vi.fn();
    renderWithHud(
      <BetAmountInput value={1} onChange={onChange} min={0.1} max={100} balance={50} />,
    );
    await userEvent.click(screen.getByRole('button', { name: '+' }));
    expect(onChange).toHaveBeenCalledWith(1.1);
    await userEvent.click(screen.getByRole('button', { name: '−' }));
    expect(onChange).toHaveBeenCalledWith(0.9);
  });

  it('пресет ставит свою сумму', async () => {
    const onChange = vi.fn();
    renderWithHud(
      <BetAmountInput value={1} onChange={onChange} min={0.1} max={100} balance={50} />,
    );
    await userEvent.click(screen.getByRole('button', { name: '0.5' }));
    expect(onChange).toHaveBeenCalledWith(0.5);
  });

  it('MAX упирается в баланс', async () => {
    const onChange = vi.fn();
    renderWithHud(
      <BetAmountInput value={1} onChange={onChange} min={0.1} max={100} balance={7} />,
    );
    await userEvent.click(screen.getByRole('button', { name: /^max$/i }));
    expect(onChange).toHaveBeenCalledWith(7);
  });

  it('×2 не перепрыгивает потолок', async () => {
    const onChange = vi.fn();
    renderWithHud(
      <BetAmountInput value={4} onChange={onChange} min={0.1} max={5} balance={100} />,
    );
    await userEvent.click(screen.getByRole('button', { name: '×2' }));
    expect(onChange).toHaveBeenCalledWith(5);
  });

  it('нативного поля ввода нет — только кнопки', () => {
    renderWithHud(<BetAmountInput value={1} onChange={() => {}} min={0.1} max={100} balance={50} />);
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument();
  });
});
