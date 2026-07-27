import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { NotificationsScreen } from './NotificationsScreen';
import { renderWithHud } from '../test/renderWithHud';
import {
  makeFakeAdapter,
  makeFailingAdapter,
  FAKE_PREFS_ENABLED_COUNT,
} from '../test/fakeAdapter';

describe('NotificationsScreen', () => {
  it('рисует общий переключатель и все 11 частных', async () => {
    renderWithHud(<NotificationsScreen />);
    // Двенадцать, а не одиннадцать: сверху есть мастер-тумблер «включить всё».
    await waitFor(() => expect(screen.getAllByRole('checkbox')).toHaveLength(12));
  });

  it('расставляет положения по ответу сервера', async () => {
    renderWithHud(<NotificationsScreen />);
    const boxes = await screen.findAllByRole('checkbox');
    expect(boxes.filter((b) => (b as HTMLInputElement).checked)).toHaveLength(
      FAKE_PREFS_ENABLED_COUNT,
    );
  });

  it('шлёт только изменённый ключ', async () => {
    const adapter = makeFakeAdapter();
    renderWithHud(<NotificationsScreen />, { adapter });
    const boxes = await screen.findAllByRole('checkbox');
    await userEvent.click(boxes[3]);
    await waitFor(() => expect(adapter.putNotificationPrefs).toHaveBeenCalledTimes(1));
    const sent = (adapter.putNotificationPrefs as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(Object.keys(sent)).toHaveLength(1);
  });

  it('возвращает переключатель назад, если сохранение упало', async () => {
    const adapter = makeFakeAdapter({
      putNotificationPrefs: vi.fn(async () => {
        throw new Error('save failed');
      }) as never,
    });
    renderWithHud(<NotificationsScreen />, { adapter });
    const boxes = await screen.findAllByRole('checkbox');
    const before = (boxes[3] as HTMLInputElement).checked;
    await userEvent.click(boxes[3]);
    await waitFor(() =>
      expect((screen.getAllByRole('checkbox')[3] as HTMLInputElement).checked).toBe(before),
    );
  });

  it('ссылается на бота из конфига, а не на захардкоженного', async () => {
    renderWithHud(<NotificationsScreen />, { config: { botUsername: 'my_bot' } });
    await waitFor(() => expect(screen.getAllByRole('checkbox')).toHaveLength(12));
    // В fatman это кнопка с текстом «@bot», открывающая t.me через Telegram
    // SDK, а не ссылка с href — поэтому ищем по тексту, а не по role="link".
    expect(screen.getByText('@my_bot')).toBeInTheDocument();
  });

  it('показывает ошибку загрузки', async () => {
    renderWithHud(<NotificationsScreen />, { adapter: makeFailingAdapter('prefs down') });
    await waitFor(() => expect(screen.getByText(/prefs down/i)).toBeInTheDocument());
  });
});
