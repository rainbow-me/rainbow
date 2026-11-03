import { expect, it } from 'vitest';

import { formatGasFee, formatGasFeeRange } from './formatGasFee';

it('uses the asset decimals and distinguishes a zero price from an unavailable price', () => {
  expect(formatGasFee('1000000', 6, 2, 'USD')).toBe('$2.00');
  expect(formatGasFee('1000000000', 18, 0, 'USD')).toBe('<$0.01');
  expect(formatGasFee('1000000000', 18, undefined, 'USD')).toBe('1.00 Gwei');
});

it('shows the current-to-maximum range for EIP-1559 and the single legacy gas price', () => {
  const settings = { isEIP1559: true, maxBaseFee: '3000000000', maxPriorityFee: '1000000000' } as const;
  expect(formatGasFeeRange(settings, '2000000000')).toBe('3.00 - 4.00 Gwei');
  expect(formatGasFeeRange(settings, undefined)).toBe('4.00 Gwei');
  expect(formatGasFeeRange({ isEIP1559: false, gasPrice: '1500000000' }, undefined)).toBe('1.50 Gwei');
});
