import { afterEach, describe, expect, it, vi } from 'vitest';

import { useChartsStore } from '@/features/charts/stores/chartsStore';
import type { Token } from '@/features/charts/types';
import { queryClient } from '@/react-query/queryClient';
import { externalTokenQueryFunction } from '@/resources/assets/externalAssetsQuery';
import { resetExternalTokenTypes, setExternalTokenType } from '@/resources/assets/testing/mockExternalTokenTypes';

import { usePnlEligibleToken } from './pnlEligibleTokenStore';

vi.mock('@/features/config/stores/remoteConfig');
vi.mock('@/react-query/queryClient');
vi.mock('@/resources/assets/externalAssetsQuery');
vi.mock('@/state/wallets/walletsStore', () => ({ getAccountAddress: () => '0xwallet', useAccountAddress: () => '0xwallet' }));
vi.mock('@/state/assets/positionsSync', () => ({ setupPositionsAssetsSync: () => undefined }));
vi.mock('@/state/assets/createUserAssetsStore', async () => {
  const { createBaseStore } = await import('@storesjs/stores');
  return { createUserAssetsStore: () => createBaseStore(() => ({ userAssets: new Map() })) };
});

const subscriptions: (() => void)[] = [];

function settle() {
  return new Promise(resolve => {
    setTimeout(resolve, 0);
  });
}

async function view(token: Token) {
  subscriptions.push(usePnlEligibleToken.subscribe(() => undefined));
  useChartsStore.getState().setToken(token);
  await settle();
}

function deferred() {
  let resolve: (type: string | null) => void = () => undefined;
  const promise = new Promise<string | null>(r => {
    resolve = r;
  });
  return { promise, resolve };
}

describe('usePnlEligibleToken', () => {
  afterEach(() => {
    subscriptions.splice(0).forEach(unsubscribe => unsubscribe());
    resetExternalTokenTypes();
    queryClient.clear();
    vi.clearAllMocks();
  });

  it.each([
    { name: 'an ordinary token', address: '0xordinary', chainId: 8453, type: 'none', eligible: true },
    { name: 'a stablecoin', address: '0xstable', chainId: 8453, type: 'stablecoin', eligible: false },
    { name: 'a token without a type', address: '0xuntyped', chainId: 8453, type: null, eligible: false },
    {
      name: 'mainnet ETH by the zero address',
      address: '0x0000000000000000000000000000000000000000',
      chainId: 1,
      type: 'native',
      eligible: false,
    },
  ])('treats $name as eligible: $eligible', async ({ address, chainId, type, eligible }) => {
    setExternalTokenType(address, type);
    await view({ address, chainId });

    expect(externalTokenQueryFunction).toHaveBeenCalled();
    expect(usePnlEligibleToken.getState()).toEqual(eligible ? { address, chainId, codexTokenId: `${address}:${chainId}` } : null);
  });

  it('excludes a native asset without looking up its type', async () => {
    await view({ address: 'eth', chainId: 1 });

    expect(externalTokenQueryFunction).not.toHaveBeenCalled();
    expect(usePnlEligibleToken.getState()).toBeNull();
  });

  it('excludes a perps market', async () => {
    await view('BTC' as Token);

    expect(externalTokenQueryFunction).not.toHaveBeenCalled();
    expect(usePnlEligibleToken.getState()).toBeNull();
  });

  it('excludes a token while its type loads or after the lookup fails', async () => {
    const type = deferred();
    setExternalTokenType('0xpending', type.promise);
    await view({ address: '0xpending', chainId: 8453 });
    expect(usePnlEligibleToken.getState()).toBeNull();

    type.resolve('none');
    await vi.waitFor(() => expect(usePnlEligibleToken.getState()?.address).toBe('0xpending'));

    setExternalTokenType('0xfailing', Promise.reject(new Error('metadata down')));
    await view({ address: '0xfailing', chainId: 8453 });
    expect(usePnlEligibleToken.getState()).toBeNull();
  });

  // Pins an ordering the store relies on: the type store follows a token switch before the eligibility re-derives
  it("never pairs a newly viewed token with the previous token's type", async () => {
    const values: unknown[] = [];
    subscriptions.push(usePnlEligibleToken.subscribe(state => values.push(state)));
    await view({ address: '0xordinary', chainId: 8453 });
    expect(usePnlEligibleToken.getState()?.address).toBe('0xordinary');

    const type = deferred();
    setExternalTokenType('0xstable', type.promise);
    await view({ address: '0xstable', chainId: 8453 });
    type.resolve('stablecoin');
    await settle();

    expect(values).not.toContainEqual(expect.objectContaining({ address: '0xstable' }));
    expect(usePnlEligibleToken.getState()).toBeNull();
  });
});
