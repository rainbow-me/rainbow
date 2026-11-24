import { expect, it, vi } from 'vitest';

import { type SolanaAssetId, type UniqueId } from '@/__swaps__/types/assets';

import { deserializeUserAssetsState, serializeUserAssetsState } from './persistence';

vi.mock('@/logger', () => ({ logger: { error: vi.fn() }, RainbowError: Error }));
it('round-trips EVM and case-sensitive Solana hidden IDs without changing the persistence format', () => {
  const ids: UniqueId[] = ['0xabc_1', 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v_1399811149' as SolanaAssetId];
  const encoded = serializeUserAssetsState({ state: { hiddenAssets: new Set(ids) }, version: 1 });
  expect(JSON.parse(encoded).state.hiddenAssets).toEqual(ids);
  expect(deserializeUserAssetsState(encoded).state.hiddenAssets).toEqual(new Set(ids));
});

it('preserves old CAIP hidden preferences under the new address_chainId identity', () => {
  const encoded = JSON.stringify({
    state: {
      hiddenAssets: ['0xabc_1', 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'],
      userAssets: [],
    },
    version: 1,
  });
  const state = deserializeUserAssetsState(encoded).state;
  expect(state.hiddenAssets).toEqual(new Set(['0xabc_1', 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v_1399811149']));
  expect(deserializeUserAssetsState(serializeUserAssetsState({ state, version: 1 })).state.hiddenAssets).toEqual(state.hiddenAssets);
});
