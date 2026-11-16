import { describe, expect, it } from 'vitest';

import { formatPayoutMultiple } from '@/features/polymarket/utils/formatPayoutMultiple';

describe('formatPayoutMultiple', () => {
  it.each([
    ['0.52', '1.9x'],
    [0.35, '2.9x'],
    ['0.3', '3.3x'],
    ['0.995', '1.0x'],
    ['1', '1.0x'],
    ['0.04', '25.0x'],
    ['0.0005', '2000.0x'],
  ])('formats price %s as %s', (price, expected) => {
    expect(formatPayoutMultiple(price)).toBe(expected);
  });

  it.each([undefined, 0, '0', '', 'not a number', '-0.1'])('is empty for price %s', price => {
    expect(formatPayoutMultiple(price)).toBe('');
  });
});
