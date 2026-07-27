/**
 * Единственный форматтер денег в библиотеке.
 *
 * Библиотека работает только в дробных единицах отображения: 1.5 значит
 * полторы монеты. Нормализация из нано-единиц — ответственность адаптера игры
 * (см. спеку, раздел «Единицы фиксируем жёстко»).
 */
export function fmtAmount(value: number | null | undefined): string {
  const n = typeof value === 'number' && Number.isFinite(value) ? value : 0;
  return n.toFixed(2);
}
