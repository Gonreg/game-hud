import { useEffect } from 'react';

/**
 * В фуллскрине Telegram рисует свой хром (крестик, «…», меню) поверх вьюпорта,
 * но на большинстве клиентов всё равно отдаёт safeAreaInset.top = 0. Без этого
 * минимума шапка кабинета уезжает под кнопки.
 */
const FULLSCREEN_TOP_FALLBACK = 88;
const FULLSCREEN_BOTTOM_FALLBACK = 24;

interface Inset {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

const ZERO: Inset = { top: 0, right: 0, bottom: 0, left: 0 };

/**
 * Пишет `--hud-safe-top/right/bottom/left` в корень документа.
 *
 * `scaleVar` — имя CSS-переменной с числовым масштабом сцены. Игры с
 * фиксированным `#stage` и `transform: scale()` (matreshka, basketball)
 * передают её, чтобы инсеты в экранных пикселях пересчитались в единицы холста.
 * Играм во весь вьюпорт (fatman, crash-race, molot) параметр не нужен.
 */
export function useTelegramSafeArea(opts: { scaleVar?: string } = {}): void {
  const { scaleVar } = opts;

  useEffect(() => {
    const root = document.documentElement;

    const apply = () => {
      const tg = window.Telegram?.WebApp;

      if (!tg) {
        for (const side of ['top', 'right', 'bottom', 'left'] as const) {
          root.style.setProperty(`--hud-safe-${side}`, '0px');
        }
        return;
      }

      const scale = scaleVar
        ? Number.parseFloat(getComputedStyle(root).getPropertyValue(scaleVar)) || 1
        : 1;

      const s: Inset = tg.safeAreaInset ?? ZERO;
      const c: Inset = tg.contentSafeAreaInset ?? ZERO;
      const fullscreen = tg.isFullscreen === true;

      const top = fullscreen ? Math.max(s.top + c.top, FULLSCREEN_TOP_FALLBACK) : s.top + c.top;
      const bottom = fullscreen
        ? Math.max(s.bottom + c.bottom, FULLSCREEN_BOTTOM_FALLBACK)
        : s.bottom + c.bottom;

      root.style.setProperty('--hud-safe-top', `${top / scale}px`);
      root.style.setProperty('--hud-safe-right', `${(s.right + c.right) / scale}px`);
      root.style.setProperty('--hud-safe-bottom', `${bottom / scale}px`);
      root.style.setProperty('--hud-safe-left', `${(s.left + c.left) / scale}px`);
      root.classList.toggle('hud-tg-fullscreen', fullscreen);
    };

    apply();

    const tg = window.Telegram?.WebApp;
    tg?.onEvent?.('safeAreaChanged', apply);
    tg?.onEvent?.('contentSafeAreaChanged', apply);
    tg?.onEvent?.('fullscreenChanged', apply);
    return () => {
      tg?.offEvent?.('safeAreaChanged', apply);
      tg?.offEvent?.('contentSafeAreaChanged', apply);
      tg?.offEvent?.('fullscreenChanged', apply);
    };
  }, [scaleVar]);
}
