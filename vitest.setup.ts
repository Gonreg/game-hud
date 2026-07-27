import '@testing-library/jest-dom/vitest';

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
      onEvent: () => {},
      offEvent: () => {},
      ready: () => {},
      expand: () => {},
    },
  },
});
