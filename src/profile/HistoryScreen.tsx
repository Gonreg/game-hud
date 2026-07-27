import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FixedSizeList, type ListChildComponentProps } from 'react-window';
import { useTranslation } from 'react-i18next';
import { useHudAdapter } from '../context/HudProvider';
import { fmtAmount } from '../format/money';
import type { Transaction } from '../adapter/types';

const ROW_HEIGHT = 64;

interface Row extends Transaction {
  dateText: string;
  kindText: string;
}

export function HistoryScreen() {
  const { t, i18n } = useTranslation();
  const adapter = useHudAdapter();
  const [items, setItems] = useState<Row[]>([]);
  const [cursor, setCursor] = useState<string | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const locale = i18n.language || 'en';

  const decorate = useCallback(
    (tx: Transaction): Row => ({
      ...tx,
      dateText: new Date(tx.createdAt).toLocaleString(locale),
      kindText: t(`history.kind.${tx.kind}`, { defaultValue: tx.kind }),
    }),
    [locale, t],
  );

  const loadPage = useCallback(
    async (cur: string | undefined) => {
      if (loading) return;
      setLoading(true);
      try {
        const r = await adapter.getTransactions(cur);
        setItems((prev) => [...prev, ...r.items.map(decorate)]);
        setCursor(r.nextCursor);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    },
    [adapter, loading, decorate],
  );

  useEffect(() => {
    if (items.length === 0 && cursor === undefined) {
      void loadPage(undefined);
    }
  }, [items.length, cursor, loadPage]);

  const onScroll = useCallback(
    ({
      scrollOffset,
      scrollDirection,
    }: {
      scrollOffset: number;
      scrollDirection: 'forward' | 'backward';
    }) => {
      if (scrollDirection !== 'forward') return;
      const threshold = ROW_HEIGHT * (items.length - 10);
      if (scrollOffset >= threshold && cursor && !loading) void loadPage(cursor);
    },
    [items.length, cursor, loading, loadPage],
  );

  const Renderer = useMemo(
    () =>
      ({ index, style }: ListChildComponentProps) => {
        const tx = items[index];
        if (!tx) return <div style={style} />;
        return (
          <div style={style}>
            <div
              className="hud-profile-list__row"
              style={{ cursor: 'default', padding: '18px 24px' }}
            >
              <span className="hud-profile-list__icon">{tx.amount >= 0 ? '↗' : '↘'}</span>
              <div className="hud-profile-list__label">
                <div>{tx.kindText}</div>
                <div className="hud-profile-hub__sub">{tx.dateText}</div>
              </div>
              <div
                className="hud-profile-list__hint"
                style={{ color: tx.amount >= 0 ? '#2dd4bf' : '#ff7a59', fontWeight: 600 }}
              >
                {tx.amount >= 0 ? '+' : ''}
                {fmtAmount(tx.amount)}
              </div>
            </div>
          </div>
        );
      },
    [items],
  );

  if (error) return <div className="hud-profile-error">{error}</div>;
  if (loading && items.length === 0)
    return <div className="hud-profile-empty">{t('common.loading')}</div>;
  if (items.length === 0) return <div className="hud-profile-empty">{t('history.empty')}</div>;

  const height = typeof window !== 'undefined' ? window.innerHeight - 200 : 600;

  return (
    <div ref={listRef} style={{ height }}>
      <FixedSizeList
        height={height}
        itemCount={items.length}
        itemSize={ROW_HEIGHT}
        width="100%"
        onScroll={onScroll}
      >
        {Renderer}
      </FixedSizeList>
    </div>
  );
}
