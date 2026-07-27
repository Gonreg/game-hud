import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { HelpScreen } from './HelpScreen';
import { useHudStore } from '../store/hudStore';
import { renderWithHud } from '../test/renderWithHud';
import { makeFakeAdapter } from '../test/fakeAdapter';

describe('HelpScreen', () => {
  beforeEach(() => {
    useHudStore.setState({ ...useHudStore.getInitialState(), open: true, screen: 'help' });
  });

  it('не отправляет пустое обращение', async () => {
    const adapter = makeFakeAdapter();
    renderWithHud(<HelpScreen />, { adapter });
    await userEvent.click(screen.getByRole('button', { name: /^send$/i }));
    expect(adapter.postSupport).not.toHaveBeenCalled();
  });

  it('отправляет текст с темой по умолчанию', async () => {
    const adapter = makeFakeAdapter();
    renderWithHud(<HelpScreen />, { adapter });
    await userEvent.type(screen.getByRole('textbox'), 'не пришёл депозит');
    await userEvent.click(screen.getByRole('button', { name: /^send$/i }));
    await waitFor(() =>
      expect(adapter.postSupport).toHaveBeenCalledWith('не пришёл депозит', 'other', []),
    );
  });

  it('подставляет тему, с которой экран открыли', async () => {
    useHudStore.setState({ ...useHudStore.getInitialState(), open: true, screen: 'help', helpTheme: 'finance' });
    const adapter = makeFakeAdapter();
    renderWithHud(<HelpScreen />, { adapter });
    await userEvent.type(screen.getByRole('textbox'), 'вопрос');
    await userEvent.click(screen.getByRole('button', { name: /^send$/i }));
    await waitFor(() => expect(adapter.postSupport).toHaveBeenCalledWith('вопрос', 'finance', []));
  });

  it('гасит тему в сторе после отправки', async () => {
    useHudStore.setState({ ...useHudStore.getInitialState(), open: true, screen: 'help', helpTheme: 'bug' });
    renderWithHud(<HelpScreen />);
    await userEvent.type(screen.getByRole('textbox'), 'баг');
    await userEvent.click(screen.getByRole('button', { name: /^send$/i }));
    await waitFor(() => expect(useHudStore.getState().helpTheme).toBeNull());
  });
});
