export interface AmountOptions {
  /**
   * Точная десятичная строка той же суммы: `-?цифры[.цифры]`, точка —
   * разделитель, без разрядов и экспоненты. Есть — печатается она. Строка,
   * которая под формат не подходит, игнорируется (в dev с предупреждением), и
   * печатается число: лучше менее точная сумма, чем мусор.
   */
  exact?: string | null;
  /**
   * Точность валюты — сколько знаков после точки у неё вообще бывает (BTC — 8,
   * ETH — 18). Нужна числу: без неё число печатается с двумя знаками, как
   * всегда. Строке не обязательна — её точность видна по ней самой.
   */
  scale?: number;
}

/**
 * Сколько знаков после точки JSON-число держит без вранья. Та же граница, что
 * у платформы и сервера стенда: дальше double печатает уже не сумму, а свою
 * двоичную погрешность (Intl честно выведет 0.1 как 0.10000000000000000555).
 * Поэтому число без точной строки дальше девятого знака не печатаем даже при
 * scale 18 — точные знаки должна принести строка.
 */
const NUMBER_EXACT_DIGITS = 9;
const MIN_FRACTION_DIGITS = 2;
const EXACT_RE = /^-?\d+(\.\d+)?$/;

/** Годный `scale` или undefined: мусорный scale не должен ронять рендер
 *  (toLocaleString бросает RangeError на отрицательной точности). */
function validScale(scale: number | undefined): number | undefined {
  return typeof scale === 'number' && Number.isInteger(scale) && scale >= 0 && scale <= 100
    ? scale
    : undefined;
}

/**
 * Единственный форматтер денег в библиотеке.
 *
 * Библиотека работает только в дробных единицах отображения: 1.5 значит
 * полторы монеты. Нормализация из нано-единиц — ответственность адаптера игры
 * (см. спеку, раздел «Единицы фиксируем жёстко»).
 *
 * Любой мусор на входе превращается в '0.00': показать игроку ноль лучше, чем
 * «NaN» посреди баланса. Но `NaN` и `Infinity` — это всегда сломанная
 * арифметика в адаптере, поэтому в dev-сборке о них сообщаем. `null` и
 * `undefined` штатны: так выглядит ещё не загруженный `me`, и молчать о них
 * обязательно — иначе предупреждение сыпалось бы на каждый рендер загрузки.
 *
 * Оговорка про границу защиты: сумма в нано-единицах, забытая недоделённой на
 * 1e9, — валидное конечное число, и здесь её не поймать. Это ловится ручной
 * проверкой баланса при интеграции каждой игры (спека, раздел 10).
 *
 * Точные суммы (с v1.4.0). У валют со scale > 9 (ETH — 18 знаков) JSON-число
 * не держит сумму, поэтому адаптер может положить рядом точную строку
 * (`opts.exact`), и тогда печатается она, а не число. Правило показа одно для
 * строки и для числа с известным `scale`: столько знаков после точки, сколько
 * значимых, но не больше `scale` и не меньше двух (`min(2, scale)` для валют
 * с меньшей точностью). Почему так: обрезать до сотых — прятать от игрока его
 * реальную ставку; показывать все 18 знаков — хвост нулей в каждой строке
 * истории («0.100000000000000000»), который не несёт информации и не влезает в
 * строку. Хвостовые нули значимых знаков не теряют, а два знака минимум
 * сохраняют привычный денежный вид («1.50», а не «1.5»).
 *
 * Без `exact` и без `scale` — ровно прежнее поведение, два знака: так вызывают
 * пять Телеграм-игр, и их вывод закреплён тестом байт в байт.
 */
export function fmtAmount(value: number | null | undefined, opts: AmountOptions = {}): string {
  const scale = validScale(opts.scale);
  if (opts.exact != null) {
    if (EXACT_RE.test(opts.exact)) return fmtExact(opts.exact, scale);
    if (import.meta.env.DEV) {
      console.warn(`[game-hud] fmtAmount: точная сумма «${opts.exact}» не десятичная строка — печатаю число`);
    }
  }

  const finite = typeof value === 'number' && Number.isFinite(value);
  if (import.meta.env.DEV && typeof value === 'number' && !finite) {
    console.warn(`[game-hud] fmtAmount получил ${String(value)} — проверь арифметику адаптера`);
  }
  const n = finite ? value : 0;
  // Разделители тысяч: на балансе в несколько тысяч «1,234.50» читается заметно
  // лучше, чем «1234.50». Локаль зафиксирована: разделитель не должен скакать
  // от языка интерфейса, иначе одна и та же сумма выглядит по-разному на десяти
  // языках. Без scale — ровно два знака, денежная конвенция и вывод до v1.4.0.
  // Со scale — до scale знаков (но не дальше того, что держит число); лишние
  // нули toLocaleString снимает сам, пока не упрётся в минимум.
  const max = scale === undefined ? 2 : Math.min(scale, NUMBER_EXACT_DIGITS);
  const min = Math.min(MIN_FRACTION_DIGITS, max);
  const text = n.toLocaleString('en-US', {
    minimumFractionDigits: min,
    maximumFractionDigits: max,
  });
  // toLocaleString сохраняет знак у почти нулевых отрицательных: -0.001 → «-0.00».
  // В балансе это читается как поломка, поэтому у нулевого результата знак снимаем.
  return dropNegativeZero(text);
}

function dropNegativeZero(text: string): string {
  return /^-[0.,]+$/.test(text) ? text.slice(1) : text;
}

/** Печать точной строки по тому же правилу — без единой операции над double. */
function fmtExact(text: string, scale: number | undefined): string {
  const negative = text.startsWith('-');
  const [rawWhole, rawFrac = ''] = (negative ? text.slice(1) : text).split('.');
  const whole = rawWhole!.replace(/^0+(?=\d)/, '');
  // Точность строки — сколько знаков в ней пришло (сервер присылает ровно
  // scale). Лишние против scale знаки не режем: строка — это правда о сумме,
  // и молча округлить её значило бы вернуть ту самую проблему.
  const min = Math.min(MIN_FRACTION_DIGITS, scale ?? MIN_FRACTION_DIGITS);
  const frac = rawFrac.replace(/0+$/, '').padEnd(min, '0');
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return dropNegativeZero(`${negative ? '-' : ''}${grouped}${frac ? `.${frac}` : ''}`);
}

/** Точная строка как целое в минимальных единицах своей же точности. */
function toMinor(text: string, digits: number): bigint {
  const negative = text.startsWith('-');
  const [whole, frac = ''] = (negative ? text.slice(1) : text).split('.');
  const minor = BigInt(whole! + frac.padEnd(digits, '0'));
  return negative ? -minor : minor;
}

/**
 * `a − b` над точными строками, без потери знаков: у ETH выплата и ставка
 * по ~1 ETH, отличающиеся на пару wei, в double вычитаются в ноль или в
 * погрешность. Результат — точная строка с точностью более точного из
 * операндов. Не строка на входе — `null`, и вызывающий считает по числам.
 */
export function subExact(a: string | null | undefined, b: string | null | undefined): string | null {
  if (a == null || b == null || !EXACT_RE.test(a) || !EXACT_RE.test(b)) return null;
  const digits = Math.max(a.split('.')[1]?.length ?? 0, b.split('.')[1]?.length ?? 0);
  const diff = toMinor(a, digits) - toMinor(b, digits);
  const negative = diff < 0n;
  const abs = (negative ? -diff : diff).toString().padStart(digits + 1, '0');
  const whole = abs.slice(0, abs.length - digits);
  const frac = digits > 0 ? `.${abs.slice(abs.length - digits)}` : '';
  return `${negative ? '-' : ''}${whole}${frac}`;
}

/** Знак точной строки: -1, 0 или 1. Для строки не из `subExact` не нужен —
 *  знак числа рядом и так верный, теряется только разность. */
export function exactSign(text: string): -1 | 0 | 1 {
  if (/^-?[0.]+$/.test(text)) return 0;
  return text.startsWith('-') ? -1 : 1;
}

/** Модуль точной строки — для мест, где знак рисуется отдельно («−3.46»). */
export function absExact(text: string | null | undefined): string | null | undefined {
  return text?.replace(/^-/, '');
}
