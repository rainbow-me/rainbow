import { describe, expect, it } from 'vitest';

import type { NativeCurrencyKey } from '@/features/currency/types';

import { formatNativeAmount, formatPnlAmount, formatPnlPercentage } from './pnlFormat';

describe('formatNativeAmount', () => {
  it.each<{ amount: string; currency: NativeCurrencyKey; expected: string }>([
    { amount: '0.00283', currency: 'USD', expected: '$0.00283' },
    { amount: '0.009', currency: 'USD', expected: '$0.009' },
    { amount: '0.01', currency: 'USD', expected: '$0.01' },
    { amount: '0.43', currency: 'USD', expected: '$0.43' },
    { amount: '0.9949', currency: 'USD', expected: '$0.99' },
    { amount: '0.995', currency: 'USD', expected: '$1' },
    { amount: '5.67', currency: 'USD', expected: '$6' },
    { amount: '7073.81', currency: 'USD', expected: '$7,074' },
    { amount: '6178.495', currency: 'USD', expected: '$6,178' },
    { amount: '-6178.32', currency: 'USD', expected: '$6,178' },
    { amount: '99999.495', currency: 'USD', expected: '$99,999' },
    { amount: '99999.5', currency: 'USD', expected: '$100.0K' },
    { amount: '166512', currency: 'USD', expected: '$166.5K' },
    { amount: '184000', currency: 'USD', expected: '$184.0K' },
    { amount: '184949.5', currency: 'USD', expected: '$184.9K' },
    { amount: '999949.5', currency: 'USD', expected: '$999.9K' },
    { amount: '999950', currency: 'USD', expected: '$1.0M' },
    { amount: '1150000', currency: 'USD', expected: '$1.2M' },
    { amount: '999950000', currency: 'USD', expected: '$1.0B' },
    { amount: '3175071090', currency: 'USD', expected: '$3.2B' },
    { amount: '999950000000', currency: 'USD', expected: '$1.0T' },
    { amount: '1500000000000000', currency: 'USD', expected: '$1,500.0T' },

    { amount: '0.4', currency: 'JPY', expected: '¥0.40' },
    { amount: '7073.6', currency: 'JPY', expected: '¥7,074' },
    { amount: '184000', currency: 'JPY', expected: '¥184.0K' },
    { amount: '4400000000000', currency: 'KRW', expected: '₩4.4T' },

    { amount: '0.43', currency: 'RUB', expected: '0.43 ₽' },
    { amount: '7073.81', currency: 'RUB', expected: '7,074 ₽' },
    { amount: '184000', currency: 'RUB', expected: '184.0K ₽' },

    { amount: '1.4567', currency: 'ETH', expected: 'Ξ1.457' },
    { amount: '6178.32', currency: 'ETH', expected: 'Ξ6,178.32' },
    { amount: '184000', currency: 'ETH', expected: 'Ξ184.0K' },
  ])('$currency $amount → $expected', ({ amount, currency, expected }) => {
    expect(formatNativeAmount(amount, currency)).toBe(expected);
  });
});

describe('formatPnlAmount', () => {
  it.each<{ amount: string; currency: NativeCurrencyKey; expected: ReturnType<typeof formatPnlAmount> }>([
    { amount: '-6178.32', currency: 'USD', expected: { direction: 'loss', display: '$6,178' } },
    { amount: '-184000', currency: 'USD', expected: { direction: 'loss', display: '$184.0K' } },
    { amount: '184000', currency: 'USD', expected: { direction: 'profit', display: '$184.0K' } },
    { amount: '-0.004', currency: 'USD', expected: { direction: 'loss', display: '$0.004' } },
    { amount: '0', currency: 'USD', expected: { direction: 'flat', display: '$0.00' } },
    { amount: '0', currency: 'JPY', expected: { direction: 'flat', display: '¥0.00' } },
  ])('$currency $amount', ({ amount, currency, expected }) => {
    expect(formatPnlAmount(amount, currency)).toEqual(expected);
  });
});

describe('formatPnlPercentage', () => {
  it.each<{ percentage: string; expected: string }>([
    { percentage: '0', expected: '0%' },
    { percentage: '-0', expected: '0%' },
    { percentage: '0.001', expected: '<1%' },
    { percentage: '0.9999', expected: '<1%' },
    { percentage: '-0.5', expected: '<1%' },
    { percentage: '1', expected: '1%' },
    { percentage: '1.5', expected: '2%' },
    { percentage: '-439.2', expected: '439%' },
    { percentage: '999.4', expected: '999%' },
    { percentage: '999.5', expected: '1.0K%' },
    { percentage: '1150', expected: '1.2K%' },
    { percentage: '3940', expected: '3.9K%' },
    { percentage: '3950', expected: '4.0K%' },
    { percentage: '999950', expected: '1.0M%' },
  ])('$percentage → $expected', ({ percentage, expected }) => {
    expect(formatPnlPercentage(percentage)).toBe(expected);
  });
});
