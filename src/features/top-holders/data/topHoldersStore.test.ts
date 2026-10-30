import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useChartsStore } from '@/features/charts/stores/chartsStore';
import { TOP_HOLDERS } from '@/features/config/constants/experimental';
import { useExperimentalConfigStore } from '@/features/config/stores/experimentalConfigStore';
import { logger } from '@/logger';
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
  setRemoteConfig({ top_holders_enabled: false, top_holders_wallet_filter: { categories: ['NORMIE'], excludedLabels: ['BOT'] } });
  return import('@/features/config/stores/__mocks__/remoteConfig');
});

const WHALE = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const EXCHANGE = '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
// Codex returns lowercase addresses
const TRADER = '0xcccccccccccccccccccccccccccccccccccccccc';
const SELLER = '0xdddddddddddddddddddddddddddddddddddddddd';

const NO_HOLDERS = { holders: { status: 'DISABLED', items: [] }, token: null };
const NO_TRADERS = { unrealized: { results: [] }, realized: { results: [] } };

function trades(overrides: Record<string, unknown>) {
  return {
    purchasedTokenBalance: '0',
    tokenAcquisitionCostUsd: '0',
    tokenBalanceLive: '0',
    tokenAmountSold1y: '0',
    amountSoldUsd1y: '0',
    realizedProfitUsd1y: '0',
    lastTransactionAt: 0,
    ...overrides,
  };
}

function respondWith(body: unknown) {
  vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify(body), { headers: { 'Content-Type': 'application/json' } }));
}

function typeLookupFor(address: string) {
  return expect.objectContaining({ queryKey: expect.arrayContaining([expect.objectContaining({ address })]) });
}

function settle() {
  return new Promise(resolve => {
    setTimeout(resolve, 0);
  });
}

async function loadViewedToken(address: string, settled: 'isSuccess' | 'isError' = 'isSuccess') {
  useChartsStore.getState().setToken({ address, chainId: 8453 });
  const unsubscribe = useTopHoldersStore.subscribe(() => undefined);
  // The token becomes eligible once its metadata type loads, and only then does the store fetch its holders
  await vi.waitFor(() => {
    const state = useTopHoldersStore.getState();
    expect(state.queryKey).toContain(address);
    expect(state.getStatus(settled)).toBe(true);
  });
  unsubscribe();
  return useTopHoldersStore.getState();
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
    await vi.waitFor(() => expect(externalTokenQueryFunction).toHaveBeenCalledWith(typeLookupFor('0xstable')));
    await settle();
    unsubscribe();

    expect(fetch).not.toHaveBeenCalled();
  });

  it('ranks holders and traders from one request, at the token price, in token units', async () => {
    useExperimentalConfigStore.getState().setFlag(TOP_HOLDERS, true);
    const traderTrades = {
      address: TRADER,
      ...trades({ purchasedTokenBalance: '10', tokenAcquisitionCostUsd: '5', tokenBalanceLive: '4' }),
    };
    const sellerTrades = {
      address: SELLER,
      ...trades({ tokenBalanceLive: '2', tokenAmountSold1y: '6', amountSoldUsd1y: '12', realizedProfitUsd1y: '9' }),
    };
    respondWith({
      data: {
        holders: {
          status: 'ENABLED',
          items: [
            { address: EXCHANGE, balance: '5000000000000000000000', wallet: { category: 'EXCHANGE', identityLabels: null } },
            { address: WHALE, balance: '100000000000000000000', wallet: { category: 'NORMIE', identityLabels: null } },
            { address: TRADER, balance: '4000000000000000000', wallet: { category: 'NORMIE', identityLabels: null } },
            { address: SELLER, balance: '2000000000000000000', wallet: { category: 'NORMIE', identityLabels: null } },
          ],
        },
        token: { decimals: 18, info: { totalSupply: '1000' } },
        prices: [{ priceUsd: 2 }],
        unrealized: { results: [traderTrades] },
        realized: { results: [sellerTrades] },
      },
    });

    const { getData } = await loadViewedToken('0xtoken');

    const { variables } = JSON.parse(String(vi.mocked(fetch).mock.lastCall?.[1]?.body));
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(variables).toEqual({ tokenId: '0xtoken:8453', address: '0xtoken', networkId: 8453, excludeLabels: ['BOT'] });
    expect(getData()).toEqual({
      holding: [
        { address: WHALE, valueUsd: '200', supplyPercentage: '10', trades: undefined },
        { address: TRADER, valueUsd: '8', supplyPercentage: '0.4', trades: traderTrades },
        { address: SELLER, valueUsd: '4', supplyPercentage: '0.2', trades: sellerTrades },
      ],
      unrealized: [
        {
          address: TRADER,
          avgEntryUsd: '0.5',
          pnl: { heldBalance: '4', cost: '2', value: '8', amount: '6', percentage: '300' },
          trades: traderTrades,
        },
      ],
      realized: [{ address: SELLER, realized: { amount: '9', percentage: '300', cost: '3' }, trades: sellerTrades }],
    });
  });

  it('shows traders when Codex does not track holders, and Realized without a price', async () => {
    useExperimentalConfigStore.getState().setFlag(TOP_HOLDERS, true);
    respondWith({
      data: {
        ...NO_HOLDERS,
        prices: [],
        unrealized: {
          results: [{ address: TRADER, ...trades({ purchasedTokenBalance: '1', tokenAcquisitionCostUsd: '1', tokenBalanceLive: '1' }) }],
        },
        realized: { results: [{ address: TRADER, ...trades({ tokenAmountSold1y: '1', amountSoldUsd1y: '2', realizedProfitUsd1y: '1' }) }] },
      },
    });

    const { getData } = await loadViewedToken('0xuntracked');

    expect(getData()).toMatchObject({ holding: [], unrealized: [], realized: [{ address: TRADER }] });
  });

  it('hides the section when no list has a row', async () => {
    useExperimentalConfigStore.getState().setFlag(TOP_HOLDERS, true);
    respondWith({ data: { ...NO_HOLDERS, prices: [{ priceUsd: 1 }], ...NO_TRADERS } });

    const { getData } = await loadViewedToken('0xempty');

    expect(getData()).toBeNull();
  });

  it('fails as a whole on a Codex error rather than showing partial lists', async () => {
    useExperimentalConfigStore.getState().setFlag(TOP_HOLDERS, true);
    vi.spyOn(logger, 'error').mockImplementation(() => undefined);
    respondWith({ data: null, errors: [{ message: 'Token not found' }] });

    const state = await loadViewedToken('0xunknown', 'isError');

    expect(state.getData()).toBeNull();
    expect(state.getCacheEntry()?.errorInfo).toBeTruthy();
    expect(logger.error).toHaveBeenCalled();
  });
});
