import { useCallback, useEffect, useRef, useState } from 'react';
import { useHudAdapter } from './HudProvider';
import type { HudAdapter } from '../adapter/types';

export interface HudResource<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

/**
 * Один запрос к адаптеру с состояниями загрузки и ошибки.
 *
 * `key` — строка, при смене которой запрос повторяется. Экраны с параметрами
 * (лидерборд) кладут параметры в ключ: `lb:profit:7d`.
 */
export function useHudResource<T>(
  key: string,
  fetcher: (adapter: HudAdapter) => Promise<T>,
): HudResource<T> {
  const adapter = useHudAdapter();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  // fetcher пересоздаётся на каждый рендер вызывающего компонента, поэтому в
  // зависимостях эффекта его нет — иначе запрос уходил бы бесконечно. Держим
  // последнюю версию в ref, а перезапрос определяют только key и tick.
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    // Promise.resolve().then(...) вместо прямого вызова: адаптер вправе бросить
    // синхронно, проверяя предусловие до похода в сеть (например «нет токена»).
    // При прямом вызове такое исключение улетает из эффекта мимо .catch(),
    // и React размонтирует всё дерево — игра уходит в чёрный экран.
    Promise.resolve()
      .then(() => fetcherRef.current(adapter))
      .then((d) => {
        if (cancelled) return;
        setData(d);
        setError(null);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : String(e));
        setData(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [adapter, key, tick]);

  return { data, loading, error, reload: useCallback(() => setTick((t) => t + 1), []) };
}
