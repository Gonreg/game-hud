import '@testing-library/jest-dom/vitest';

/** Подписчики Telegram-событий: тесты эмитят через emitTelegramEvent. */
const tgListeners = new Map<string, Set<() => void>>();

/** Разослать Telegram-событие подписчикам — как это делает настоящий клиент. */
export function emitTelegramEvent(event: string): void {
  for (const cb of tgListeners.get(event) ?? []) cb();
}

/** Сколько живых подписчиков на событии — для проверки, что отписка сработала. */
export function telegramListenerCount(event: string): number {
  return tgListeners.get(event)?.size ?? 0;
}

// Библиотека читает Telegram.WebApp в нескольких местах (аватар, BackButton,
// safe-area). В jsdom его нет — ставим минимальный мок, тесты переопределяют
// нужные куски точечно.
Object.defineProperty(window, 'Telegram', {
  writable: true,
  configurable: true,
  value: {
    WebApp: {
      initDataUnsafe: { user: { id: 1, first_name: 'Test', username: 'test' } },
      BackButton: { show: () => {}, hide: () => {}, onClick: () => {}, offClick: () => {} },
      HapticFeedback: { impactOccurred: () => {} },
      safeAreaInset: { top: 0, right: 0, bottom: 0, left: 0 },
      contentSafeAreaInset: { top: 0, right: 0, bottom: 0, left: 0 },
      isFullscreen: false,
      // Реальный мини-эмиттер, а не заглушка: тесты должны уметь дёрнуть
      // подписанный колбэк и заметить отписку не той ссылкой.
      onEvent: (event: string, cb: () => void) => {
        const list = tgListeners.get(event) ?? new Set<() => void>();
        list.add(cb);
        tgListeners.set(event, list);
      },
      offEvent: (event: string, cb: () => void) => {
        tgListeners.get(event)?.delete(cb);
      },
      ready: () => {},
      expand: () => {},
    },
  },
});
