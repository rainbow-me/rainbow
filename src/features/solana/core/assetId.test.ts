import { expect, it } from 'vitest';

import { getUniqueId } from '@/entities/assetId';

import { migrateSolanaAssetId, migrateSolanaPinnedAssets } from './assetId';
import { SOLANA_CHAIN_ID, SOLANA_MAINNET_CHAIN } from './chainId';

const mint = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
it('uses the existing ID constructor without lowercasing Solana or changing EVM behavior', () => {
  expect(getUniqueId(mint, SOLANA_CHAIN_ID)).toBe(`${mint}_1399811149`);
  expect(getUniqueId('0xAbC', 8453)).toBe('0xAbC_8453');
});
it('migrates only valid Solana mainnet preference keys and is idempotent', () => {
  const legacy = `${SOLANA_MAINNET_CHAIN}/token:${mint}`;
  const id = `${mint}_${SOLANA_CHAIN_ID}`;
  expect(migrateSolanaAssetId(legacy)).toBe(id);
  expect(migrateSolanaAssetId(id)).toBe(id);
  for (const other of ['0xabc_1', `${SOLANA_MAINNET_CHAIN}/token:invalid`, `solana:other/token:${mint}`]) {
    expect(migrateSolanaAssetId(other)).toBe(other);
  }
  expect(migrateSolanaPinnedAssets({ [legacy]: true, '0xabc_1': true })).toEqual({ [id]: true, '0xabc_1': true });
  const current = { [id]: true, '0xabc_1': true };
  expect(migrateSolanaPinnedAssets(current)).toBe(current);
});
