/**
 * Дата есть не у всех бэков: у basketball история раундов не отдаёт временную
 * метку (`GameRound.createdAt`), у molot обработчик вывода не выбирает колонку
 * `created_at`, хотя она есть в базе (`Withdrawal.createdAt`). Пустая или
 * мусорная строка дала бы `new Date(...).toLocaleString()` === «Invalid Date».
 * Рисуем дату только когда она есть и действительно разбирается.
 */
export function formatWhen(
  raw: string | undefined,
  locale: string,
  /**
   * `'datetime'` — история раундов: там время отличает соседние ставки.
   * `'date'` — список выводов: так было в fatman, который остаётся каноном
   * визуала, и менять это ради переиспользования функции не стоит.
   */
  mode: 'datetime' | 'date' = 'datetime',
): string | null {
  if (!raw) return null;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return null;
  return mode === 'date' ? d.toLocaleDateString(locale) : d.toLocaleString(locale);
}

/**
 * Срок, до которого игрок ещё успевает что-то сделать (сгорание бонуса): день,
 * месяц и время до минут на языке интерфейса. Одной даты мало — в последний
 * день она не говорит, сгорит ли бонус утром или ночью; секунды из
 * `toLocaleString` — шум. Год не пишем: срок всегда в ближайшие недели.
 * Пустая или неразборчивая строка — null, как у `formatWhen`.
 */
export function formatDeadline(raw: string | undefined, locale: string): string | null {
  if (!raw) return null;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString(locale, {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });
}
