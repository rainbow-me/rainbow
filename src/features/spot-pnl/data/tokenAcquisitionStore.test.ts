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

  it('caches the wallet acquisition for getData and reuses it while fresh', async () => {
    const acquisition = { purchasedTokenBalance: '10', tokenAcquisitionCostUsd: '100' };
    const params = { ...PARAMS, tokenAddress: '0xcached' };
    const store = useTokenAcquisitionStore.getState();
    respondWith({ data: { filterTokenWallets: { results: [acquisition] } } });

    await store.fetch(params, { skipStoreUpdates: 'withCache' });
    await store.fetch(params, { skipStoreUpdates: 'withCache' });

    expect(useTokenAcquisitionStore.getState().getData(params)).toEqual(acquisition);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(JSON.parse(String(vi.mocked(fetch).mock.calls[0][1]?.body)).variables).toEqual({ wallet: '0xwallet', tokenId: '0xcached:8453' });
  });

  it('returns null when Codex has no acquisition', async () => {
    respondWith({ data: { filterTokenWallets: { results: [] } } });
    await expect(fetchAcquisition()).resolves.toBeNull();
  });

  it('fails when the GraphQL envelope carries errors', async () => {
    respondWith({ errors: [{ message: 'Field "filterTokenWallets" is not allowed' }] });
    await expect(fetchAcquisition()).rejects.toThrow('not allowed');
  });
});
