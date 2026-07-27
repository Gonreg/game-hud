import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useTelegramSafeArea } from './useTelegramSafeArea';
import { emitTelegramEvent, telegramListenerCount } from '../../vitest.setup';

function setTg(over: Record<string, unknown>) {
  Object.assign(window.Telegram!.WebApp as unknown as Record<string, unknown>, over);
}

function readVar(name: string) {
  return document.documentElement.style.getPropertyValue(name);
}

describe('useTelegramSafeArea', () => {
  beforeEach(() => {
    document.documentElement.style.cssText = '';
    setTg({
      safeAreaInset: { top: 0, right: 0, bottom: 0, left: 0 },
      contentSafeAreaInset: { top: 0, right: 0, bottom: 0, left: 0 },
      isFullscreen: false,
    });
  });

  it('пишет переменные из инсетов Telegram', () => {
    setTg({
      safeAreaInset: { top: 20, right: 2, bottom: 10, left: 3 },
      contentSafeAreaInset: { top: 30, right: 0, bottom: 0, left: 0 },
    });
    renderHook(() => useTelegramSafeArea());
    expect(readVar('--hud-safe-top')).toBe('50px');
    expect(readVar('--hud-safe-bottom')).toBe('10px');
    expect(readVar('--hud-safe-left')).toBe('3px');
    expect(readVar('--hud-safe-right')).toBe('2px');
  });

  it('в фуллскрине подставляет минимум сверху, когда Telegram отдаёт нули', () => {
    // Telegram сообщает top=0, хотя его собственный хром висит над вьюпортом.
    setTg({ isFullscreen: true });
    renderHook(() => useTelegramSafeArea());
    expect(readVar('--hud-safe-top')).toBe('88px');
    expect(readVar('--hud-safe-bottom')).toBe('24px');
  });

  it('делит инсеты на масштаб сцены, если он задан', () => {
    // matreshka и basketball держат #stage 390x844 с transform: scale().
    document.documentElement.style.setProperty('--stage-scale-num', '0.5');
    setTg({ safeAreaInset: { top: 20, right: 0, bottom: 8, left: 0 } });
    renderHook(() => useTelegramSafeArea({ scaleVar: '--stage-scale-num' }));
    expect(readVar('--hud-safe-top')).toBe('40px');
    expect(readVar('--hud-safe-bottom')).toBe('16px');
  });

  it('не падает вне Telegram и обнуляет переменные', () => {
    const saved = window.Telegram;
    // Telegram в Window объявлен опциональным, так что undefined — валидное
    // значение по типам; проверяем поведение вне Telegram, а не ошибку типов.
    window.Telegram = undefined;
    renderHook(() => useTelegramSafeArea());
    expect(readVar('--hud-safe-top')).toBe('0px');
    window.Telegram = saved;
  });

  it('отписывается ровно теми же ссылками при размонтировании', () => {
    const { unmount } = renderHook(() => useTelegramSafeArea());
    expect(telegramListenerCount('safeAreaChanged')).toBe(1);
    unmount();
    expect(telegramListenerCount('safeAreaChanged')).toBe(0);
  });

  it('пересчитывает инсеты по событию от Telegram', () => {
    renderHook(() => useTelegramSafeArea());
    setTg({ safeAreaInset: { top: 12, right: 0, bottom: 0, left: 0 } });
    emitTelegramEvent('safeAreaChanged');
    expect(readVar('--hud-safe-top')).toBe('12px');
  });
});
