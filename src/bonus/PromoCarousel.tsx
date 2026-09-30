import { useRef, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useHudConfig } from '../context/HudProvider';
import { fmtAmount } from '../format/money';
import { IconChevron, IconUsers } from '../primitives/icons';
import { useHudStore } from '../store/hudStore';
import { GiftIcon3D } from './GiftIcon3D';
import { freeSpinsActive, useBonuses } from './useBonuses';

interface Slide {
  id: 'spins' | 'deposit' | 'referral';
  title: string;
  sub: string;
  art: ReactNode;
  onOpen: () => void;
}

/**
 * Промо-карусель кабинета — над строкой балансов. Все рекламные активности,
 * которые у игрока реально есть (BonusOverview), по карточке на каждую:
 * фриспины, бонус к пополнению, реферальная программа. Тап ведёт к подробностям:
 * фриспины — в шит «Бонусы», пополнение — в кассу, друзья — на экран рефералов.
 *
 * Прокрутка — нативная, со snap: свайп пальцем на телефоне работает сам, без
 * своего жестового кода. Точки под лентой — те же слайды кнопками: и
 * индикатор, и способ перейти без свайпа (для клавиатуры и скринридера).
 * Активную точку считаем по scrollLeft ленты, а не по таймеру: автопрокрутки
 * нет намеренно — карточка не должна уезжать из-под пальца.
 */
export function PromoCarousel() {
  const { t } = useTranslation();
  const { currency, scale } = useHudConfig();
  const { data: b, supported } = useBonuses();
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  if (!supported || !b) return null;

  const slides: Slide[] = [];
  if (freeSpinsActive(b)) {
    const fs = b.freeSpins!;
    slides.push({
      id: 'spins',
      title: t('bonus.promo_spins_title', { left: fs.left }),
      sub: t('bonus.promo_spins_sub', {
        amount: fmtAmount(fs.stake, { exact: fs.stakeStr, scale }),
        currency,
      }),
      art: <GiftIcon3D width={52} height={52} />,
      onOpen: () => useHudStore.getState().openBonuses(),
    });
  }
  if (b.depositBonus) {
    slides.push({
      id: 'deposit',
      title: t('bonus.promo_deposit_title', { percent: b.depositBonus.percent }),
      sub: t('bonus.promo_deposit_sub', { mult: b.depositBonus.wagerMultiplier }),
      art: <span className="hud-promo-card__percent">+{b.depositBonus.percent}%</span>,
      onOpen: () => useHudStore.getState().openWalletWithFocus('deposit'),
    });
  }
  if (b.referral) {
    slides.push({
      id: 'referral',
      title: t('bonus.promo_referral_title', { rate: b.referral.ratePercent }),
      sub: t('bonus.promo_referral_sub'),
      art: (
        <span className="hud-promo-card__users">
          <IconUsers />
        </span>
      ),
      onOpen: () => useHudStore.getState().setScreen('referrals'),
    });
  }
  if (slides.length === 0) return null;

  const onScroll = () => {
    const el = trackRef.current;
    if (!el || el.clientWidth === 0) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    setActive(Math.min(slides.length - 1, Math.max(0, i)));
  };
  const goTo = (i: number) => {
    const el = trackRef.current;
    setActive(i);
    // scrollTo есть не везде (jsdom в тестах) — активную точку ставим сами.
    el?.scrollTo?.({ left: i * el.clientWidth, behavior: 'smooth' });
  };

  return (
    <div
      className="hud-promo-carousel"
      role="region"
      aria-roledescription="carousel"
      aria-label={t('bonus.carousel_aria')}
    >
      <div className="hud-promo-carousel__track" ref={trackRef} onScroll={onScroll}>
        {slides.map((s, i) => (
          <button
            key={s.id}
            type="button"
            className={`hud-promo-card hud-promo-card--${s.id}`}
            aria-roledescription="slide"
            aria-label={`${s.title}. ${s.sub}`}
            data-track={`promo_${s.id}`}
            onClick={s.onOpen}
            onFocus={() => setActive(i)}
          >
            <span className="hud-promo-card__art" aria-hidden="true">
              {s.art}
            </span>
            <span className="hud-promo-card__text">
              <span className="hud-promo-card__title">{s.title}</span>
              <span className="hud-promo-card__sub">{s.sub}</span>
            </span>
            <span className="hud-promo-card__chev" aria-hidden="true">
              <IconChevron />
            </span>
          </button>
        ))}
      </div>
      {slides.length > 1 && (
        <div className="hud-promo-carousel__dots">
          {slides.map((s, i) => (
            <button
              key={s.id}
              type="button"
              className={`hud-promo-carousel__dot${i === active ? ' hud-promo-carousel__dot--on' : ''}`}
              aria-label={t('bonus.slide_aria', { n: i + 1, total: slides.length })}
              aria-current={i === active ? 'true' : undefined}
              onClick={() => goTo(i)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
