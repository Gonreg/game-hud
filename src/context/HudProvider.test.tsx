import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { HudProvider, useHudAdapter, useHudConfig } from './HudProvider';
import { makeFakeAdapter } from '../test/fakeAdapter';

function Probe() {
  const adapter = useHudAdapter();
  const config = useHudConfig();
  return (
    <div>
      <span data-testid="currency">{config.currency}</span>
      <span data-testid="has-getme">{typeof adapter.getMe}</span>
    </div>
  );
}

describe('HudProvider', () => {
  it('раздаёт адаптер и конфиг вниз по дереву', () => {
    render(
      <HudProvider
        adapter={makeFakeAdapter()}
        config={{ botUsername: 'test_bot', currency: 'GRAM', minBet: 0.1, maxBet: 100 }}
      >
        <Probe />
      </HudProvider>,
    );
    expect(screen.getByTestId('currency')).toHaveTextContent('GRAM');
    expect(screen.getByTestId('has-getme')).toHaveTextContent('function');
  });

  it('падает понятной ошибкой, если хук вызван вне провайдера', () => {
    // Гасим шум React про пойманную ошибку рендера.
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Probe />)).toThrow(/HudProvider/);
    spy.mockRestore();
  });
});
