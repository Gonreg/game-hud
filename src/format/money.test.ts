import { describe, expect, it, vi } from 'vitest';
import { absExact, exactSign, fmtAmount, subExact } from './money';

describe('fmtAmount', () => {
  it('печатает два знака после запятой', () => {
    expect(fmtAmount(1.5)).toBe('1.50');
    expect(fmtAmount(0)).toBe('0.00');
    expect(fmtAmount(1234.567)).toBe('1,234.57');
  });

  it('считает null и undefined нулём, а не падает', () => {
    expect(fmtAmount(null)).toBe('0.00');
    expect(fmtAmount(undefined)).toBe('0.00');
  });

  it('не превращает NaN и Infinity в мусор на экране', () => {
    // Предупреждение здесь ожидаемо — глушим, чтобы вывод тестов оставался чистым.
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(fmtAmount(Number.NaN)).toBe('0.00');
    expect(fmtAmount(Number.POSITIVE_INFINITY)).toBe('0.00');
    expect(warn).toHaveBeenCalledTimes(2);
    warn.mockRestore();
  });

  it('не показывает минус нуль на почти нулевых суммах', () => {
    expect(fmtAmount(-0.001)).toBe('0.00');
  });

  it('печатает отрицательные суммы со знаком', () => {
    expect(fmtAmount(-3.2)).toBe('-3.20');
  });

  it('ругается в dev на NaN — это всегда сломанный адаптер', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    fmtAmount(Number.NaN);
    expect(warn).toHaveBeenCalledOnce();
    warn.mockRestore();
  });

  it('молчит на null и undefined — так выглядит незагруженный me', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    fmtAmount(null);
    fmtAmount(undefined);
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it('ставит разделители тысяч, чтобы крупный баланс читался', () => {
    expect(fmtAmount(1234.5)).toBe('1,234.50');
    expect(fmtAmount(1000000)).toBe('1,000,000.00');
  });
});

describe('fmtAmount с точной строкой (валюты со scale > 9)', () => {
  it('печатает строку, а не число, которое её уже потеряло', () => {
    // Число 0.12345678901234568 — то, что доезжает от 0.123456789012345678 в JSON.
    expect(fmtAmount(0.12345678901234568, { exact: '0.123456789012345678', scale: 18 })).toBe(
      '0.123456789012345678',
    );
  });

  it('снимает хвостовые нули, но оставляет минимум два знака', () => {
    expect(fmtAmount(0.1, { exact: '0.100000000000000000', scale: 18 })).toBe('0.10');
    expect(fmtAmount(1.5, { exact: '1.500000000000000000' })).toBe('1.50');
    expect(fmtAmount(0.001, { exact: '0.001000000000000000' })).toBe('0.001');
    expect(fmtAmount(0, { exact: '0.000000000000000000' })).toBe('0.00');
  });

  it('не теряет последний wei', () => {
    expect(fmtAmount(1, { exact: '1.000000000000000001' })).toBe('1.000000000000000001');
  });

  it('ставит разделители тысяч и знак, как у числа', () => {
    expect(fmtAmount(-1234567.5, { exact: '-1234567.500000000000000000' })).toBe('-1,234,567.50');
  });

  it('не показывает минус нуль и у строки', () => {
    expect(fmtAmount(0, { exact: '-0.000000000000000000' })).toBe('0.00');
  });

  it('у валюты без дробной части не выдумывает «.00»', () => {
    expect(fmtAmount(100, { exact: '100', scale: 0 })).toBe('100');
  });

  it('не режет строку длиннее scale: это правда о сумме, а не шум', () => {
    expect(fmtAmount(0.123, { exact: '0.123', scale: 2 })).toBe('0.123');
  });

  it('на строке не того формата печатает число и ругается в dev', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(fmtAmount(1.5, { exact: '1,5' })).toBe('1.50');
    expect(fmtAmount(1.5, { exact: '1e-18' })).toBe('1.50');
    expect(warn).toHaveBeenCalledTimes(2);
    warn.mockRestore();
  });

  it('exact: null ничем не отличается от отсутствия строки', () => {
    expect(fmtAmount(1234.567, { exact: null })).toBe('1,234.57');
  });
});

describe('fmtAmount с точностью валюты (число без строки)', () => {
  it('BTC: все восемь знаков, без хвостовых нулей, минимум два', () => {
    expect(fmtAmount(0.12345678, { scale: 8 })).toBe('0.12345678');
    expect(fmtAmount(0.0001, { scale: 8 })).toBe('0.0001');
    expect(fmtAmount(1.5, { scale: 8 })).toBe('1.50');
    expect(fmtAmount(1234.5, { scale: 8 })).toBe('1,234.50');
  });

  it('scale 2 — байт в байт как без него', () => {
    for (const v of [1.5, 0, 1234.567, -0.001, -3.2, 0.005]) {
      expect(fmtAmount(v, { scale: 2 })).toBe(fmtAmount(v));
    }
  });

  it('число дальше девятого знака не печатает: там уже двоичная погрешность', () => {
    // Intl напечатал бы 0.1 при 18 знаках как 0.100000000000000006.
    expect(fmtAmount(0.1, { scale: 18 })).toBe('0.10');
    expect(fmtAmount(0.12345678901234568, { scale: 18 })).toBe('0.123456789');
  });

  it('округление до scale снимает погрешность float: 0.3 − 0.1 печатается как 0.20', () => {
    expect(fmtAmount(0.3 - 0.1, { scale: 8 })).toBe('0.20');
  });

  it('у валюты без дробной части печатает целое', () => {
    expect(fmtAmount(100, { scale: 0 })).toBe('100');
  });

  it('мусорный scale не роняет рендер, а возвращает прежние два знака', () => {
    expect(fmtAmount(1.23456, { scale: -1 })).toBe('1.23');
    expect(fmtAmount(1.23456, { scale: 2.5 })).toBe('1.23');
    expect(fmtAmount(1.23456, { scale: Number.NaN })).toBe('1.23');
  });

  it('не показывает минус нуль при большей точности', () => {
    expect(fmtAmount(-0.0000000001, { scale: 8 })).toBe('0.00');
  });
});

describe('арифметика над точными строками', () => {
  it('subExact вычитает до последнего знака, где double даёт ноль', () => {
    expect(1.000000000000000002 - 1.000000000000000001).toBe(0);
    expect(subExact('1.000000000000000002', '1.000000000000000001')).toBe('0.000000000000000001');
    expect(subExact('0.000000000000000000', '1.500000000000000000')).toBe('-1.500000000000000000');
    expect(subExact('2.5', '2.5')).toBe('0.0');
  });

  it('subExact выравнивает точность операндов', () => {
    expect(subExact('1.5', '0.25')).toBe('1.25');
    expect(subExact('10', '0.001')).toBe('9.999');
  });

  it('subExact без обеих годных строк отдаёт null — считать по числам', () => {
    expect(subExact(undefined, '1.0')).toBeNull();
    expect(subExact('1.0', null)).toBeNull();
    expect(subExact('1,0', '1.0')).toBeNull();
  });

  it('exactSign и absExact', () => {
    expect(exactSign('0.000000000000000001')).toBe(1);
    expect(exactSign('-0.000000000000000001')).toBe(-1);
    expect(exactSign('-0.000')).toBe(0);
    expect(absExact('-3.5')).toBe('3.5');
    expect(absExact(undefined)).toBeUndefined();
  });
});
