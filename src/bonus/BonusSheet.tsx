import { useTranslation } from 'react-i18next';
import { useHudConfig } from '../context/HudProvider';
import { formatDeadline } from '../format/datetime';
import { fmtAmount } from '../format/money';
import { BottomSheet } from '../primitives/BottomSheet';
import { InfoPopover } from '../primitives/InfoPopover';
import { IconClose } from '../primitives/icons';
import { Skeleton } from '../primitives/Skeleton';
import { useHudStore } from '../store/hudStore';
import type { BonusOverview } from '../adapter/types';
import { GiftIcon3D } from './GiftIcon3D';
import {
  bonusRulesText,
  freeSpinsActive,
  minDepositText,
  useBonuses,
  wageringActive,
} from './useBonuses';

/**
 * Шит «Бонусы»: все бонусные активности игрока по разделам — фриспины, бонус
 * к пополнению, отыгрыш, реферальная система. Только то, что реально активно
 * у этой игры и этого игрока (BonusOverview): раздела без данных нет вовсе.
 *
 * Открывается кнопкой BonusButton поверх игры и карточкой фриспинов из
 * карусели кабинета — поэтому смонтирован в ProfileShell вне оверлея кабинета
 * и лежит выше него по z-index (.hud-bonus-backdrop).
 */
export function BonusSheet() {
  const open = useHudStore((s) => s.bonusOpen);
  const close = useHudStore((s) => s.closeBonuses);
  return (
    <BottomSheet
      open={open}
      onClose={close}
      labelledBy="hud-bonus-sheet-title"
      backdropClassName="hud-bonus-backdrop"
    >
      <BonusSheetBody onClose={close} />
    </BottomSheet>
  );
}

function BonusSheetBody({ onClose }: { onClose: () => void }) {
  const { t, i18n } = useTranslation();
  const { currency, scale } = useHudConfig();
  const { data: b, loading } = useBonuses();
  const lang = i18n.language || 'en';

  const money = (v: number, exact?: string) => fmtAmount(v, { exact, scale });
  const stake = b?.freeSpins ? money(b.freeSpins.stake, b.freeSpins.stakeStr) : '';

  // Переходы из шита закрывают его: игрок уходит в кассу или к друзьям, и
  // шит поверх кабинета заслонял бы экран, ради которого он нажал.
  const goDeposit = () => {
    onClose();
    useHudStore.getState().openWalletWithFocus('deposit');
  };
  const goReferrals = () => {
    onClose();
    useHudStore.setState({ open: true, screen: 'referrals' });
  };
  // «Играть фриспином» — назад к игре: кнопка фриспина живёт в панели ставки.
  const goPlay = () => {
    onClose();
    useHudStore.getState().close();
  };

  const spins = freeSpinsActive(b) ? b!.freeSpins! : null;
  const w = wageringActive(b) ? b!.wagering! : null;
  const spinsDeadline = spins ? formatDeadline(spins.expiresAt, lang) : null;
  const nothing = !loading && !spins && !b?.depositBonus && !w && !b?.referral;

  return (
    <div className="hud-bonus-sheet">
      <div className="hud-sheet__head">
        <div className="hud-bonus-sheet__title-row">
          <GiftIcon3D width={30} height={30} />
          <span id="hud-bonus-sheet-title" className="hud-sheet__title">
            {t('bonus.title')}
          </span>
          {b && <InfoPopover text={bonusRulesText(t, b, currency, stake, scale)} />}
        </div>
        <button
          type="button"
          className="hud-sheet__close"
          onClick={onClose}
          aria-label={t('common.close')}
        >
          <IconClose />
        </button>
      </div>

      {loading && !b && <Skeleton rows={3} />}
      {nothing && <div className="hud-sheet__hint">{t('bonus.empty')}</div>}

      {spins && (
        <section
          className="hud-sheet__group hud-bonus-section hud-bonus-section--spins"
          aria-labelledby="hud-bonus-spins"
        >
          <div id="hud-bonus-spins" className="hud-sheet__group-label">
            {t('bonus.free_spins_title')}
          </div>
          <div className="hud-bonus-section__big">
            {t('bonus.free_spins_left', { left: spins.left, total: spins.total })}
          </div>
          <div className="hud-bonus-section__line">
            {t('bonus.free_spins_stake', { amount: stake, currency })}
          </div>
          {spinsDeadline && (
            <div className="hud-bonus-section__line">
              {t('bonus.free_spins_expires', { date: spinsDeadline })}
            </div>
          )}
          <div className="hud-bonus-section__text">
            {t('bonus.free_spins_how', { mult: spins.wagerMultiplier })}
          </div>
          <button type="button" className="hud-profile-btn hud-profile-btn--primary" onClick={goPlay}>
            {t('bonus.free_spins_play')}
          </button>
        </section>
      )}

      {b?.depositBonus && (
        <section
          className="hud-sheet__group hud-bonus-section hud-bonus-section--deposit"
          aria-labelledby="hud-bonus-dep"
        >
          <div id="hud-bonus-dep" className="hud-sheet__group-label">
            {t('bonus.deposit_title', { percent: b.depositBonus.percent })}
          </div>
          <div className="hud-bonus-section__text">
            {t('bonus.deposit_text', {
              percent: b.depositBonus.percent,
              mult: b.depositBonus.wagerMultiplier,
            })}
          </div>
          <button type="button" className="hud-profile-btn hud-profile-btn--primary" onClick={goDeposit}>
            {t('bonus.deposit_cta')}
          </button>
        </section>
      )}

      {w && (
        <WageringSection
          w={w}
          money={money}
          lang={lang}
          min={minDepositText(b, scale)}
          currency={currency}
          onDeposit={goDeposit}
        />
      )}

      {b?.referral && (
        <section
          className="hud-sheet__group hud-bonus-section hud-bonus-section--ref"
          aria-labelledby="hud-bonus-ref"
        >
          <div id="hud-bonus-ref" className="hud-sheet__group-label">
            {t('bonus.referral_title')}
          </div>
          <div className="hud-bonus-section__text">
            {t('bonus.referral_text', { rate: b.referral.ratePercent })}
          </div>
          <button type="button" className="hud-profile-btn" onClick={goReferrals}>
            {t('bonus.referral_cta')}
          </button>
        </section>
      )}
    </div>
  );
}

type Wagering = NonNullable<BonusOverview['wagering']>;

function WageringSection({
  w,
  money,
  lang,
  min,
  currency,
  onDeposit,
}: {
  w: Wagering;
  money: (v: number, exact?: string) => string;
  lang: string;
  /** Минимальное пополнение, открывающее вывод («5.00»), или null. */
  min: string | null;
  currency: string;
  onDeposit: () => void;
}) {
  const { t } = useTranslation();
  // Две разные вещи в одном разделе. Текущий отыгрыш — удержание с остатком
  // оборота и сроком. Заработанное — уже отыгранные деньги, которые ждут
  // только пополнения: не сгорают и от текущего отыгрыша не зависят.
  const earned = w.earned ?? 0;
  const active = w.remaining > 0 || w.held > 0;
  // Прогресс — от назначенного оборота. Знаменателя нет (бэк его не знает) —
  // полосы нет, остаётся строка с остатком: рисовать выдуманный процент нельзя.
  const done =
    active && w.total > 0 ? Math.min(1, Math.max(0, (w.total - w.remaining) / w.total)) : null;
  const pct = done == null ? null : Math.floor(done * 100);
  const cleared = w.remaining <= 0;
  const expires = active && !cleared ? formatDeadline(w.expiresAt, lang) : null;
  // Бэк без отдельного счётчика заработанного (earned нет): отыгранное, но
  // не выведенное удержание приходит как held при нулевом остатке.
  const legacyWaiting = w.earned == null && cleared && w.held > 0 && !w.hasDeposit;
  const waiting = (earned > 0 && !w.hasDeposit) || legacyWaiting;
  const waitingAmount = earned > 0 ? money(earned, w.earnedStr) : money(w.held, w.heldStr);
  return (
    <section
      className="hud-sheet__group hud-bonus-section hud-bonus-section--wager"
      aria-labelledby="hud-bonus-wager"
    >
      <div id="hud-bonus-wager" className="hud-sheet__group-label">
        {t('bonus.wager_title')}
      </div>
      {pct != null && (
        <>
          <div
            className="hud-bonus-progress"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={pct}
            aria-label={t('bonus.wager_title')}
          >
            <div className="hud-bonus-progress__fill" style={{ width: `${pct}%` }} />
          </div>
          <div className="hud-bonus-section__line">
            {t('bonus.wager_progress', {
              done: money(Math.max(0, w.total - w.remaining)),
              total: money(w.total, w.totalStr),
            })}
          </div>
        </>
      )}
      {!cleared && (
        <div className="hud-bonus-section__line">
          {t('bonus.wager_left', { amount: money(w.remaining, w.remainingStr) })}
        </div>
      )}
      {w.held > 0 && !legacyWaiting && (
        <div className="hud-bonus-section__line">
          {t('bonus.wager_held', { amount: money(w.held, w.heldStr) })}
        </div>
      )}
      {expires && (
        <div className="hud-bonus-section__line">{t('bonus.wager_expires', { date: expires })}</div>
      )}
      {waiting ? (
        <>
          <div className="hud-bonus-section__big hud-bonus-section__big--earned">
            {t('bonus.wager_earned', { amount: waitingAmount })}
          </div>
          <div className="hud-bonus-section__text hud-bonus-section__text--accent">
            {min
              ? t('bonus.wager_earned_cta_min', { min, currency })
              : t('bonus.wager_earned_cta')}
          </div>
          <button type="button" className="hud-profile-btn hud-profile-btn--primary" onClick={onDeposit}>
            {t('bonus.deposit_cta')}
          </button>
        </>
      ) : (
        <div
          className={`hud-bonus-deposit-status${w.hasDeposit ? ' hud-bonus-deposit-status--ok' : ''}`}
        >
          {w.hasDeposit
            ? t('bonus.wager_deposit_ok')
            : min
              ? t('bonus.wager_deposit_needed_min', { min, currency })
              : t('bonus.wager_deposit_needed')}
        </div>
      )}
    </section>
  );
}
