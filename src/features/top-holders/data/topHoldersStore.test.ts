import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useChartsStore } from '@/features/charts/stores/chartsStore';
import { TOP_HOLDERS } from '@/features/config/constants/experimental';
import { useExperimentalConfigStore } from '@/features/config/stores/experimentalConfigStore';
import { externalTokenQueryFunction } from '@/resources/assets/externalAssetsQuery';
import { setExternalTokenType } from '@/resources/assets/testing/mockExternalTokenTypes';

import { useTopHoldersStore } from './topHoldersStore';

vi.mock('@/react-query/queryClient');
vi.mock('@/resources/assets/externalAssetsQuery');
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

const WHALE = '0xAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAa';
const EXCHANGE = '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';

function respondWith(body: unknown) {
  vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify(body), { headers: { 'Content-Type': 'application/json' } }));
}

function requestBodies() {
  return vi.mocked(fetch).mock.calls.map(call => JSON.parse(String(call[1]?.body)));
}

async function loadViewedToken(address: string) {
  useChartsStore.getState().setToken({ address, chainId: 8453 });
  const unsubscribe = useTopHoldersStore.subscribe(() => undefined);
  // The token becomes eligible once its metadata type loads, and only then does the store fetch its holders
  await vi.waitFor(() => {
    const state = useTopHoldersStore.getState();
    expect(state.queryKey).toContain(address);
    expect(state.getStatus('isSuccess')).toBe(true);
  });
  unsubscribe();
  return useTopHoldersStore.getState().getData();
}

describe('useTopHoldersStore', () => {
  beforeEach(() => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Unexpected request'));
  });

  afterEach(() => {
    vi.restoreAllMocks();
    useExperimentalConfigStore.getState().setFlag(TOP_HOLDERS, false);
  });

  it('does not request Codex while the feature is off', async () => {
    useChartsStore.getState().setToken({ address: '0xtoken', chainId: 8453 });
    const unsubscribe = useTopHoldersStore.subscribe(() => undefined);
    await new Promise(resolve => {
      setTimeout(resolve, 50);
    });
    unsubscribe();

    expect(fetch).not.toHaveBeenCalled();
  });

  it('does not request Codex for a stablecoin', async () => {
    useExperimentalConfigStore.getState().setFlag(TOP_HOLDERS, true);
    setExternalTokenType('0xstable', 'stablecoin');
    useChartsStore.getState().setToken({ address: '0xstable', chainId: 8453 });
    const unsubscribe = useTopHoldersStore.subscribe(() => undefined);
    await new Promise(resolve => {
      setTimeout(resolve, 50);
    });
    unsubscribe();

    expect(externalTokenQueryFunction).toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('joins swap history to holders across address casing, in token units', async () => {
    useExperimentalConfigStore.getState().setFlag(TOP_HOLDERS, true);
    respondWith({
      data: {
        holders: {
          status: 'ENABLED',
          items: [
            {
              address: EXCHANGE,
              balance: '5000000000000000000000',
              tokenPriceUsd: '2',
              wallet: { category: 'EXCHANGE', identityLabels: null },
            },
            { address: WHALE, balance: '100000000000000000000', tokenPriceUsd: '2', wallet: { category: 'NORMIE', identityLabels: null } },
          ],
        },
        token: { decimals: 18, info: { totalSupply: '1000' } },
      },
    });
    respondWith({
      data: {
        filterTokenWallets: {
          results: [
            {
              address: WHALE.toLowerCase(),
              purchasedTokenBalance: '100',
              tokenAcquisitionCostUsd: '50',
              tokenAmountSold1y: '0',
              amountSoldUsd1y: '0',
              realizedProfitUsd1y: '0',
              lastTransactionAt: 0,
            },
          ],
        },
      },
    });

    const data = await loadViewedToken('0xtoken');

    expect(requestBodies().map(body => body.variables)).toEqual([
      { tokenId: '0xtoken:8453', address: '0xtoken', networkId: 8453 },
      { wallets: [EXCHANGE, WHALE], tokenId: '0xtoken:8453', limit: 2 },
    ]);
    expect(data?.byStake.map(row => [row.holder.address, row.holder.balance, row.valueUsd, row.supplyPercentage])).toEqual([
      [WHALE, '100', '200', '10'],
    ]);
    expect(data?.byProfit.map(row => [row.holder.address, row.pnl.amount])).toEqual([[WHALE, '150']]);
  });

  it('hides the section when Codex does not track holders for the token', async () => {
    useExperimentalConfigStore.getState().setFlag(TOP_HOLDERS, true);
    respondWith({ data: { holders: { status: 'DISABLED', items: [] }, token: null } });

    await expect(loadViewedToken('0xuntracked')).resolves.toBeNull();
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
