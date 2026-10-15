import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useViewedTokenStore } from '@/features/token/data/stores/viewedTokenStore';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';

import { useTokenAcquisitionStore, type TokenAcquisitionParams } from './tokenAcquisitionStore';

const PARAMS: TokenAcquisitionParams = { walletAddress: '0xwallet', codexTokenId: '0xtoken:8453' };

function respondWith(body: unknown) {
  vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify(body), { headers: { 'Content-Type': 'application/json' } }));
}

function fetchAcquisition() {
  return useTokenAcquisitionStore.getState().fetch(PARAMS, { force: true, throwOnError: true });
}

describe('useTokenAcquisitionStore', () => {
  beforeEach(() => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Unexpected request'));
    userAssetsStoreManager.setState({ address: '0xwallet' });
  });

  afterEach(() => vi.restoreAllMocks());

  it('fetches the viewed token for the current wallet once subscribed', async () => {
    const acquisition = { purchasedTokenBalance: '10', tokenAcquisitionCostUsd: '100' };
    useViewedTokenStore.getState().setToken({ address: '0xviewed', chainId: 8453 });
    respondWith({ data: { filterTokenWallets: { results: [acquisition] } } });

    const unsubscribe = useTokenAcquisitionStore.subscribe(() => undefined);
    await vi.waitFor(() => expect(useTokenAcquisitionStore.getState().getData()).toEqual(acquisition));
    unsubscribe();

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(JSON.parse(String(vi.mocked(fetch).mock.calls[0][1]?.body)).variables).toEqual({ wallet: '0xwallet', tokenId: '0xviewed:8453' });
  });

  it('does not request a perps market', async () => {
    useViewedTokenStore.getState().setToken('BTC');

    const unsubscribe = useTokenAcquisitionStore.subscribe(() => undefined);
    await vi.waitFor(() => expect(useTokenAcquisitionStore.getState().getStatus('isSuccess')).toBe(true));
    unsubscribe();

    expect(useTokenAcquisitionStore.getState().getData()).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
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
