import { useTranslation } from 'react-i18next';
import { useHudStore } from '../store/hudStore';
import { GiftIcon3D } from './GiftIcon3D';
import { freeSpinsActive, useBonuses } from './useBonuses';

/**
 * Плавающая кнопка «Бонусы» с объёмным подарком — под аватаром кабинета и
 * шестерёнкой настроек (позиция в .hud-bonus-chip, та же сетка отступов, что
 * у них). Тап открывает шит «Бонусы» (BonusSheet), смонтированный в
 * ProfileShell.
 *
 * Бэк без getBonuses — кнопки нет: открывать было бы нечего. Бейдж — сколько
 * фриспинов осталось: это единственное, что игрок может потратить прямо
 * сейчас, и повод нажать.
 */
export function BonusButton() {
  const { t } = useTranslation();
  const openBonuses = useHudStore((s) => s.openBonuses);
  const { data, supported } = useBonuses();
  if (!supported) return null;
  const spins = freeSpinsActive(data) ? data!.freeSpins!.left : 0;
  return (
    <button
      type="button"
      className={`hud-bonus-chip${spins > 0 ? ' hud-bonus-chip--hot' : ''}`}
      onClick={openBonuses}
      aria-label={spins > 0 ? t('bonus.button_aria_spins', { count: spins }) : t('bonus.title')}
      data-track="bonus_button"
    >
      <GiftIcon3D className="hud-bonus-chip__icon" />
      {spins > 0 && <span className="hud-bonus-chip__badge">{spins}</span>}
    </button>
  );
}
