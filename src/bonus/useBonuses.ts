import type { TFunction } from 'i18next';
import { useHudAdapter } from '../context/HudProvider';
import { useHudResource, type HudResource } from '../context/useHudResource';
import { useHudStore } from '../store/hudStore';
import type { BonusOverview } from '../adapter/types';

/**
 * Бонусы игрока через адаптер. `supported` — есть ли у бэка механика вообще
 * (`getBonuses`): без неё кнопка и карусель не рисуются, а не показывают пустоту.
 *
 * Перезапрос — по `bonusTick` из стора: игра поднимает его, когда фриспины или
 * отыгрыш могли измениться (ставка, расчёт раунда, депозит), и кнопка с
 * каруселью подтягивают свежие данные без собственного таймера.
 */
export function useBonuses(): HudResource<BonusOverview | null> & { supported: boolean } {
  const adapter = useHudAdapter();
  const tick = useHudStore((s) => s.bonusTick);
  const supported = typeof adapter.getBonuses === 'function';
  const res = useHudResource<BonusOverview | null>(`bonuses:${tick}`, (a) =>
    a.getBonuses ? a.getBonuses() : Promise.resolve(null),
  );
  return { ...res, supported };
}

/** Фриспины можно поставить прямо сейчас. */
export function freeSpinsActive(b: BonusOverview | null | undefined): boolean {
  return Boolean(b?.freeSpins && b.freeSpins.left > 0);
}

/** Есть что отыгрывать или отыгранное ждёт депозита. */
export function wageringActive(b: BonusOverview | null | undefined): boolean {
  const w = b?.wagering;
  return Boolean(w && (w.held > 0 || w.remaining > 0));
}

/**
 * Полные условия бонусов одним текстом — для «?» у отыгрыша в кассе и в шите
 * «Бонусы». Собираются из того, что реально включено у игры: абзаца про
 * фриспины нет у игры без фриспинов, про срок — без срока. Числа берутся из
 * бэка, поэтому смена окружения не расходится с текстом.
 */
export function bonusRulesText(t: TFunction, b: BonusOverview, currency: string, stake: string): string {
  const parts: string[] = [t('bonus.rules_intro')];
  if (b.freeSpins) {
    parts.push(
      t('bonus.rules_free_spins', {
        total: b.freeSpins.total,
        stake,
        currency,
        mult: b.freeSpins.wagerMultiplier,
      }),
    );
  }
  if (b.depositBonus) {
    parts.push(
      t('bonus.rules_deposit', {
        percent: b.depositBonus.percent,
        mult: b.depositBonus.wagerMultiplier,
      }),
    );
  }
  parts.push(t('bonus.rules_turnover'));
  parts.push(t('bonus.rules_deposit_required'));
  if (b.expiryDays && b.expiryDays > 0) {
    parts.push(t('bonus.rules_expiry', { days: b.expiryDays }));
  }
  return parts.join('\n\n');
}
