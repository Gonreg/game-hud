/**
 * Дата есть не у всех бэков: у basketball история раундов не отдаёт временную
 * метку (`GameRound.createdAt`), у molot обработчик вывода не выбирает колонку
 * `created_at`, хотя она есть в базе (`Withdrawal.createdAt`). Пустая или
 * мусорная строка дала бы `new Date(...).toLocaleString()` === «Invalid Date».
 * Рисуем дату только когда она есть и действительно разбирается.
 */
export function formatWhen(raw: string | undefined, locale: string): string | null {
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d.toLocaleString(locale);
}
