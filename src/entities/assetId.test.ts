import { expect, it } from 'vitest';

import { getUniqueId } from '@/entities/assetId';
import { SOLANA_CHAIN_ID } from '@/features/solana/core/chainId';

const mint = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
it('uses the existing ID constructor without lowercasing Solana or changing EVM behavior', () => {
  expect(getUniqueId(mint, SOLANA_CHAIN_ID)).toBe(`${mint}_1399811149`);
  expect(getUniqueId('0xAbC', 8453)).toBe('0xAbC_8453');
});
