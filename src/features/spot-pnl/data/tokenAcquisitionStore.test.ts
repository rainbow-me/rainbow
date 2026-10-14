import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useTokenAcquisitionStore, type TokenAcquisitionParams } from './tokenAcquisitionStore';

const PARAMS: TokenAcquisitionParams = { walletAddress: '0xwallet', tokenAddress: '0xtoken', chainId: 8453 };

function respondWith(body: unknown) {
  vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify(body), { headers: { 'Content-Type': 'application/json' } }));
}

function fetchAcquisition() {
  return useTokenAcquisitionStore.getState().fetch(PARAMS, { force: true, skipStoreUpdates: 'withCache', throwOnError: true });
}

describe('useTokenAcquisitionStore', () => {
  beforeEach(() => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Unexpected request'));
  });

  afterEach(() => vi.restoreAllMocks());

  it('returns the wallet acquisition, or null when Codex has none', async () => {
    const acquisition = { purchasedTokenBalance: '10', tokenAcquisitionCostUsd: '100' };
    respondWith({ data: { filterTokenWallets: { results: [acquisition] } } });
    await expect(fetchAcquisition()).resolves.toEqual(acquisition);

    respondWith({ data: { filterTokenWallets: { results: [] } } });
    await expect(fetchAcquisition()).resolves.toBeNull();
  });

  it('fails when the GraphQL envelope carries errors', async () => {
    respondWith({ errors: [{ message: 'Field "filterTokenWallets" is not allowed' }] });
    await expect(fetchAcquisition()).rejects.toThrow('not allowed');
  });
});
