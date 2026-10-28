import { describe, expect, it } from 'vitest';

import type { NativeCurrencyKey } from '@/features/currency/types';

import { formatNativeAmount, formatPnlAmount, type NativeAmountStyle } from './pnlFormat';

describe('formatNativeAmount', () => {
  it.each<{ amount: string; currency: NativeCurrencyKey; style: NativeAmountStyle | undefined; expected: string }>([
    { amount: '7073.81', currency: 'USD', style: undefined, expected: '$7,073.81' },
    { amount: '146935.5', currency: 'USD', style: 'exact', expected: '$146,935.50' },
    { amount: '0.00283', currency: 'USD', style: 'exact', expected: '$0.00283' },

    { amount: '769.68', currency: 'USD', style: 'compact', expected: '$769.68' },
    { amount: '999.5', currency: 'USD', style: 'compact', expected: '$999.50' },
    { amount: '999.995', currency: 'USD', style: 'compact', expected: '$1,000' },
    { amount: '6178.32', currency: 'USD', style: 'compact', expected: '$6,178' },
    { amount: '9999.4', currency: 'USD', style: 'compact', expected: '$9,999' },
    { amount: '9999.6', currency: 'USD', style: 'compact', expected: '$10K' },
    { amount: '9999.495', currency: 'USD', style: 'compact', expected: '$9,999' },
    { amount: '32700', currency: 'USD', style: 'compact', expected: '$32.7K' },
    { amount: '1900000', currency: 'USD', style: 'compact', expected: '$1.9M' },

    { amount: '0.00283', currency: 'USD', style: 'whole', expected: '$0.00283' },
    { amount: '0.43', currency: 'USD', style: 'whole', expected: '$0.43' },
    { amount: '0.996', currency: 'USD', style: 'whole', expected: '$1' },
    { amount: '5.67', currency: 'USD', style: 'whole', expected: '$6' },
    { amount: '7073.81', currency: 'USD', style: 'whole', expected: '$7,074' },
    { amount: '6178.495', currency: 'USD', style: 'whole', expected: '$6,178' },
    { amount: '10124.4', currency: 'USD', style: 'whole', expected: '$10,124' },
    { amount: '1234567.8', currency: 'USD', style: 'whole', expected: '$1,234,568' },

    { amount: '0.4', currency: 'JPY', style: 'whole', expected: '¥0.40' },
    { amount: '7073.6', currency: 'JPY', style: 'whole', expected: '¥7,074' },
    { amount: '769.4', currency: 'JPY', style: 'compact', expected: '¥769' },
    { amount: '32700', currency: 'JPY', style: 'compact', expected: '¥32.7K' },

    { amount: '1.4567', currency: 'ETH', style: 'whole', expected: 'Ξ1.457' },
    { amount: '6178.32', currency: 'ETH', style: 'compact', expected: 'Ξ6,178.32' },
  ])('$style $currency $amount → $expected', ({ amount, currency, style, expected }) => {
    expect(formatNativeAmount(amount, currency, { style })).toBe(expected);
  });
});

describe('formatPnlAmount', () => {
  it.each<{ amount: string; style: NativeAmountStyle; expected: ReturnType<typeof formatPnlAmount> }>([
    { amount: '-6178.32', style: 'compact', expected: { direction: 'loss', display: '$6,178' } },
    { amount: '32700', style: 'compact', expected: { direction: 'profit', display: '$32.7K' } },
    { amount: '0', style: 'compact', expected: { direction: 'flat', display: '$0.00' } },
  ])('$style $amount', ({ amount, style, expected }) => {
    expect(formatPnlAmount(amount, 'USD', { style })).toEqual(expected);
  });
});
