import { Logger } from '@ethersproject/logger';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useChartsStore } from '@/features/charts/stores/chartsStore';
import { TOP_HOLDERS } from '@/features/config/constants/experimental';
import { useExperimentalConfigStore } from '@/features/config/stores/experimentalConfigStore';

import { useTopHolderNamesStore } from './topHolderNamesStore';
import { useTopHoldersStore } from './topHoldersStore';

const { lookupAddress } = vi.hoisted(() => ({ lookupAddress: vi.fn<(address: string) => Promise<string | null>>() }));
vi.mock('@/handlers/web3', () => ({ getProvider: () => ({ lookupAddress }) }));
vi.mock('@/state/wallets/walletsStore', () => ({ getAccountAddress: () => '0xwallet', useAccountAddress: () => '0xwallet' }));
vi.mock('@/state/assets/positionsSync', () => ({ setupPositionsAssetsSync: () => undefined }));
vi.mock('@/state/assets/createUserAssetsStore', async () => {
  const { createBaseStore } = await import('@storesjs/stores');
  return { createUserAssetsStore: () => createBaseStore(() => ({ userAssets: new Map() })) };
});
vi.mock('@/features/config/stores/remoteConfig', async () => {
  const { setRemoteConfig } = await import('@/features/config/testing/mockRemoteConfig');
  setRemoteConfig({ top_holders_enabled: false, top_holders_wallet_filter: { categories: ['NORMIE'], excludedLabels: [] } });
  return import('@/features/config/stores/__mocks__/remoteConfig');
});

const NAMED = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const UNNAMED = '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
const BROKEN_RECORD = '0xcccccccccccccccccccccccccccccccccccccccc';

function respondWithHolders(addresses: string[]) {
  const body = (data: unknown) => new Response(JSON.stringify({ data }), { headers: { 'Content-Type': 'application/json' } });
  vi.mocked(fetch)
    .mockResolvedValueOnce(
      body({
        holders: {
          status: 'ENABLED',
          items: addresses.map(address => ({
            address,
            balance: '1000000000000000000',
            tokenPriceUsd: '2',
            wallet: { category: 'NORMIE', identityLabels: null },
          })),
        },
        token: { decimals: 18, info: { totalSupply: '1000' } },
      })
    )
    .mockResolvedValueOnce(body({ filterTokenWallets: { results: [] } }));
}

function ethersError(code: string) {
  return Object.assign(new Error(code), { code });
}

describe('useTopHolderNamesStore', () => {
  const subscriptions: (() => void)[] = [];

  beforeEach(() => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Unexpected request'));
    useExperimentalConfigStore.getState().setFlag(TOP_HOLDERS, true);
    subscriptions.push(
      useTopHoldersStore.subscribe(() => undefined),
      useTopHolderNamesStore.subscribe(() => undefined)
    );
  });

  afterEach(() => {
    subscriptions.splice(0).forEach(unsubscribe => unsubscribe());
    vi.restoreAllMocks();
    useExperimentalConfigStore.getState().setFlag(TOP_HOLDERS, false);
  });

  it('lists holders before their names resolve, then names the ones with a valid reverse record', async () => {
    let resolveNamed: (name: string) => void = () => undefined;
    lookupAddress.mockImplementation(address => {
      if (address.toLowerCase() === NAMED) {
        return new Promise(resolve => {
          resolveNamed = resolve;
        });
      }
      if (address.toLowerCase() === BROKEN_RECORD) return Promise.reject(ethersError(Logger.errors.CALL_EXCEPTION));
      return Promise.resolve(null);
    });
    respondWithHolders([NAMED, UNNAMED, BROKEN_RECORD]);

    useChartsStore.getState().setToken({ address: '0xnamed', chainId: 8453 });

    await vi.waitFor(() => expect(useTopHoldersStore.getState().getData()?.byStake).toHaveLength(3));
    expect(useTopHolderNamesStore.getState().getData()).toBeNull();

    resolveNamed('named.eth');
    await vi.waitFor(() => expect(useTopHolderNamesStore.getState().getData()).toEqual({ [NAMED]: 'named.eth' }));
  });

  it('fails instead of caching no names when the RPC is unreachable', async () => {
    lookupAddress.mockImplementation(address =>
      address.toLowerCase() === NAMED ? Promise.reject(ethersError(Logger.errors.NETWORK_ERROR)) : Promise.resolve('other.eth')
    );
    respondWithHolders([NAMED, UNNAMED]);

    useChartsStore.getState().setToken({ address: '0xunreachable', chainId: 8453 });

    await vi.waitFor(() => expect(useTopHolderNamesStore.getState().getStatus('isError')).toBe(true));
    expect(useTopHolderNamesStore.getState().getData()).toBeNull();
  });
});
