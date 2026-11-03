import { expect, it, vi } from 'vitest';

import { isValidWallet } from './validators';

vi.mock('@/handlers/web3', () => ({}));

it('admits valid DNS names for watch entry while rejecting malformed names', () => {
  expect(isValidWallet('sub.alice.xyz')).toBe(true);
  expect(isValidWallet('alice.crypto')).toBe(true);
  expect(isValidWallet('alice..xyz')).toBe(false);
  expect(isValidWallet('0x123.xyz')).toBe(false);
});
