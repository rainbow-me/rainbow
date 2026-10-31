import { expect, it } from 'vitest';

import { abbreviateName, formatAddressForDisplay } from './formatAddress';

it.each([
  ['averyveryverylongensname.eth', 20, 2, 'averyveryverylon...name.eth'],
  ['averyveryverylongensname.base.eth', 20, 2, 'averyveryverylon...name.base.eth'],
  ['averyveryverylongensname.wallet.rainbow.xyz', 8, 4, 'aver...name.wallet.rainbow.xyz'],
] as const)('shortens only the first label of %s', (name, length, buffer, expected) => {
  expect(abbreviateName(name, length, buffer)).toBe(expected);
});

it('preserves DNS names in mixed displays and never abbreviates addresses as names', () => {
  const address = '0x1111111111111111111111111111111111111111';
  expect(formatAddressForDisplay('sub.alice.xyz')).toBe('sub.alice.xyz');
  expect(formatAddressForDisplay(address)).toBe('0x11111111...1111');
  expect(abbreviateName(address)).toBe(address);
});
